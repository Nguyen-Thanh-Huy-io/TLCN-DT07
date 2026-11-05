#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
world_history_scraper.py
------------------------
Cào dữ liệu Lịch sử Thế giới từ Wikipedia tiếng Việt:
- Napoléon Bonaparte, Julius Caesar
- Chiến tranh thế giới thứ hai, Trận Stalingrad, Trận Waterloo
- Gắn region: "Châu Âu", "La Mã"
"""

import os
import re
import json
import uuid
import requests
from bs4 import BeautifulSoup

HEADERS = {
    'User-Agent': 'HisgoWorldHistoryScraper/1.0 (https://hisgo.vn; dev@hisgo.vn)'
}

API_URL = "https://vi.wikipedia.org/w/api.php"


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'\[\d+\]', '', text)
    text = re.sub(r'\[[a-zA-Z]\]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def extract_years(text: str):
    if not text:
        return None, None
    matches = re.findall(r'\b(\d{3,4})\b', text)
    if len(matches) == 1:
        y = int(matches[0])
        return y, y
    elif len(matches) >= 2:
        return int(matches[0]), int(matches[1])
    return None, None


def parse_infobox(soup: BeautifulSoup, is_person: bool = True):
    infobox = soup.find('table', class_=lambda c: c and 'infobox' in c)
    if not infobox:
        return {}

    data = {}
    for row in infobox.find_all('tr'):
        th = row.find('th')
        td = row.find('td')
        if th and td:
            key = clean_text(th.text)
            val = clean_text(td.text)
            if key and val:
                data[key.lower()] = val

    meta = {}
    birth_key = next((k for k in data if 'sinh' in k), None)
    death_key = next((k for k in data if 'mất' in k or 'qua đời' in k), None)
    reign_key = next((k for k in data if 'trị vì' in k or 'tại vị' in k or 'nhiệm kỳ' in k), None)
    hometown_key = next((k for k in data if 'quê quán' in k or 'nơi sinh' in k), None)

    if is_person:
        meta['person'] = {}
        if birth_key:
            meta['person']['birthDateLabel'] = data[birth_key]
        if death_key:
            meta['person']['deathDateLabel'] = data[death_key]
        if hometown_key:
            meta['person']['hometown'] = data[hometown_key]
        if reign_key:
            meta['person']['titles'] = data[reign_key]
    else:
        meta['event'] = {}
        time_key = next((k for k in data if 'thời gian' in k or 'ngày' in k), None)
        outcome_key = next((k for k in data if 'kết quả' in k), None)
        belligerents_key = next((k for k in data if 'tham chiến' in k or 'lực lượng' in k), None)

        if time_key:
            meta['event']['dateNote'] = data[time_key]
        if outcome_key:
            meta['event']['outcome'] = data[outcome_key]
        if belligerents_key:
            meta['event']['belligerents'] = [data[belligerents_key]]

    return meta


def html_to_blocks(soup: BeautifulSoup, max_blocks: int = 8):
    blocks = []
    body_soup = BeautifulSoup(str(soup), 'html.parser')

    for tag in body_soup.find_all(['table', 'style', 'script', 'sup', 'link']):
        tag.decompose()

    elements = body_soup.find_all(['h2', 'h3', 'p', 'blockquote'])
    
    for el in elements:
        text_content = clean_text(el.text)
        if not text_content or len(text_content) < 30:
            continue

        if el.name in ['h2', 'h3']:
            if any(x in text_content.lower() for x in ['tham khảo', 'liên kết ngoài', 'xem thêm', 'chú thích', 'thư mục', 'chú giải']):
                break
            blocks.append({
                'id': str(uuid.uuid4()),
                'type': 'HEADING',
                'width': 'FULL',
                'level': 2 if el.name == 'h2' else 3,
                'text': text_content
            })
        elif el.name == 'p':
            blocks.append({
                'id': str(uuid.uuid4()),
                'type': 'TEXT',
                'width': 'FULL',
                'content': f'<p>{text_content}</p>'
            })
        elif el.name == 'blockquote':
            blocks.append({
                'id': str(uuid.uuid4()),
                'type': 'QUOTE',
                'width': 'FULL',
                'quoteText': text_content,
                'author': 'Sử liệu quốc tế'
            })

        if len(blocks) >= max_blocks:
            break

    return blocks


def crawl_page(target: dict):
    page_name = target['page']
    print(f"-> Đang cào Lịch sử Thế giới: {target['title']} ({page_name})...")

    params = {
        'action': 'parse',
        'page': page_name,
        'prop': 'text|images',
        'format': 'json',
        'redirects': 1
    }

    try:
        res = requests.get(API_URL, params=params, headers=HEADERS, timeout=20)
        res.raise_for_status()
        data = res.json()

        if 'error' in data:
            print(f"❌ Lỗi từ Wikipedia API: {data['error'].get('info')}")
            return None

        parse_obj = data.get('parse', {})
        html_content = parse_obj.get('text', {}).get('*', '')
        soup = BeautifulSoup(html_content, 'html.parser')

        is_person = target['categorySlug'] == 'nhan-vat'
        meta = parse_infobox(soup, is_person=is_person)
        meta['region'] = target.get('region', 'Thế giới')

        # Clean soup for summary
        clean_soup = BeautifulSoup(str(soup), 'html.parser')
        for t in clean_soup.find_all('table'):
            t.decompose()

        summary = ""
        for p in clean_soup.find_all('p'):
            clean_p = clean_text(p.text)
            if len(clean_p) > 60:
                summary = clean_p
                break

        start_year, end_year = extract_years(summary)
        date_text = None
        if start_year and end_year:
            date_text = f"{start_year} - {end_year}" if start_year != end_year else str(start_year)

        blocks = html_to_blocks(soup)

        return {
            'title': target['title'],
            'slug': target['slug'],
            'categorySlug': target['categorySlug'],
            'topicSlug': target['topicSlug'],
            'tags': target.get('tags', []),
            'region': target.get('region', 'Thế giới'),
            'summary': summary[:300] + '...' if len(summary) > 300 else summary,
            'dateText': date_text,
            'startYear': start_year,
            'endYear': end_year,
            'metadata': meta,
            'contentBlocks': blocks
        }

    except Exception as e:
        print(f"❌ Lỗi khi cào {target['title']}: {e}")
        return None


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    targets_file = os.path.join(script_dir, 'world_targets.json')
    out_dir = os.path.join(script_dir, 'data', 'processed')
    os.makedirs(out_dir, exist_ok=True)

    with open(targets_file, 'r', encoding='utf-8') as f:
        config = json.load(f)

    crawled_articles = []
    for item in config.get('articles', []):
        res = crawl_page(item)
        if res:
            crawled_articles.append(res)

    output = {
        'topics': config.get('topics', []),
        'timelines': config.get('timelines', []),
        'articles': crawled_articles
    }

    out_file = os.path.join(out_dir, 'crawled_world_history.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 HOÀN THÀNH: Đã xuất {len(crawled_articles)} bài Lịch sử Thế giới vào '{out_file}'")


if __name__ == '__main__':
    main()
