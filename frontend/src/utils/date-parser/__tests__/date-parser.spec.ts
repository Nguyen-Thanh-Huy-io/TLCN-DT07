import { parseFlexibleHistoricalDate, HistoricalEra } from '../../history-year.utils';
import { parseRomanNumeral, toRomanNumeral } from '../roman-numerals.util';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- BẮT ĐẦU TEST SMART HISTORICAL DATE PARSER ---');

// 1. Test Roman Numerals
console.log('1. Kiểm tra Roman Numerals...');
assert(parseRomanNumeral('XIX') === 19, 'XIX phải bằng 19');
assert(parseRomanNumeral('xix') === 19, 'xix chữ thường phải bằng 19');
assert(parseRomanNumeral('X') === 10, 'X phải bằng 10');
assert(parseRomanNumeral('III') === 3, 'III phải bằng 3');
assert(parseRomanNumeral('IV') === 4, 'IV phải bằng 4');
assert(parseRomanNumeral('XXI') === 21, 'XXI phải bằng 21');
assert(toRomanNumeral(19) === 'XIX', '19 phải thành XIX');
assert(toRomanNumeral(10) === 'X', '10 phải thành X');
assert(toRomanNumeral(3) === 'III', '3 phải thành III');
console.log('-> Roman Numerals: PASSED');

// 2. Test "Khoảng thế kỷ 19" (Ca người dùng chụp ảnh)
console.log('2. Kiểm tra "Khoảng thế kỷ 19"...');
const resUserCase = parseFlexibleHistoricalDate('Khoảng thế kỷ 19', false);
assert(resUserCase.valid === true, 'Khoảng thế kỷ 19 phải valid: true');
assert(resUserCase.absYear === 1801, `absYear phải là 1801, nhận được ${resUserCase.absYear}`);
assert(resUserCase.signedYear === 1801, `signedYear phải là 1801, nhận được ${resUserCase.signedYear}`);
assert(resUserCase.displayPoint === 'Khoảng thế kỷ 19', 'displayPoint phải giữ nguyên');
console.log('-> "Khoảng thế kỷ 19": PASSED');

// 3. Test "Khoảng thế kỷ 19" với isBce = true (Trước Công nguyên)
console.log('3. Kiểm tra "Khoảng thế kỷ 19" Trước CN...');
const resBceCase = parseFlexibleHistoricalDate('Khoảng thế kỷ 19', true);
assert(resBceCase.valid === true, 'Khoảng thế kỷ 19 TCN phải valid: true');
assert(resBceCase.signedYear === -1900, `signedYear phải là -1900, nhận được ${resBceCase.signedYear}`);
assert(resBceCase.era === HistoricalEra.BCE, 'era phải là BCE');
assert(resBceCase.displayPoint.includes('TCN'), 'displayPoint phải có TCN');
console.log('-> "Khoảng thế kỷ 19" TCN: PASSED');

// 4. Test số La Mã: "Thế kỷ XIX", "Thế kỷ X", "TK III"
console.log('4. Kiểm tra Thế kỷ số La Mã...');
const resRoman19 = parseFlexibleHistoricalDate('Thế kỷ XIX', false);
assert(resRoman19.valid === true, 'Thế kỷ XIX phải valid: true');
assert(resRoman19.absYear === 1801, 'Thế kỷ XIX absYear = 1801');

const resRoman10 = parseFlexibleHistoricalDate('Thế kỷ X', false);
assert(resRoman10.valid === true, 'Thế kỷ X phải valid: true');
assert(resRoman10.absYear === 901, 'Thế kỷ X absYear = 901');
console.log('-> Thế kỷ số La Mã: PASSED');

// 5. Test phân đoạn: "Đầu thế kỷ XX", "Cuối thế kỷ 18"
console.log('5. Kiểm tra phân đoạn thế kỷ...');
const resDauTk20 = parseFlexibleHistoricalDate('Đầu thế kỷ XX', false);
assert(resDauTk20.valid === true, 'Đầu thế kỷ XX phải valid: true');
assert(resDauTk20.absYear === 1901, 'Đầu thế kỷ XX absYear = 1901');

const resCuoiTk18 = parseFlexibleHistoricalDate('Cuối thế kỷ 18', false);
assert(resCuoiTk18.valid === true, 'Cuối thế kỷ 18 phải valid: true');
assert(resCuoiTk18.absYear === 1775, `Cuối thế kỷ 18 absYear = 1775, nhận được ${resCuoiTk18.absYear}`);
console.log('-> Phân đoạn thế kỷ: PASSED');

// 6. Test năm ước lượng: "Khoảng năm 938", "~1945"
console.log('6. Kiểm tra năm ước lượng...');
const resApproxYear = parseFlexibleHistoricalDate('Khoảng năm 938', false);
assert(resApproxYear.valid === true, 'Khoảng năm 938 phải valid: true');
assert(resApproxYear.absYear === 938, 'absYear = 938');
assert(resApproxYear.signedYear === 938, 'signedYear = 938');

const resTildeYear = parseFlexibleHistoricalDate('~1945', false);
assert(resTildeYear.valid === true, '~1945 phải valid: true');
assert(resTildeYear.absYear === 1945, 'absYear = 1945');
console.log('-> Năm ước lượng: PASSED');

// 7. Test ngày tháng chuẩn (tương thích ngược 100%)
console.log('7. Kiểm tra tương thích ngược ngày tháng chuẩn...');
const resDate = parseFlexibleHistoricalDate('19/05/1959', false);
assert(resDate.valid === true && resDate.day === 19 && resDate.month === 5 && resDate.absYear === 1959, '19/05/1959 valid');

const resMonth = parseFlexibleHistoricalDate('05/1959', false);
assert(resMonth.valid === true && resMonth.month === 5 && resMonth.absYear === 1959, '05/1959 valid');

const resYear = parseFlexibleHistoricalDate('1959', false);
assert(resYear.valid === true && resYear.absYear === 1959, '1959 valid');
console.log('-> Tương thích ngược: PASSED');

console.log('=== TẤT CẢ TEST ĐÃ VƯỢT QUA 100% THÀNH CÔNG! ===');
