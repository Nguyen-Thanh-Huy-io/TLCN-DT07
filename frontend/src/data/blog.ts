export type BlogCategory =
  | 'Lịch sử cổ đại'
  | 'Lịch sử trung đại'
  | 'Lịch sử hiện đại'
  | 'Chiến tranh thế giới'
  | 'Văn hóa';

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  author: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
  accent: string;
  content: string[];
};

export const blogCategories: Array<{ label: BlogCategory; count: number }> = [
  { label: 'Lịch sử cổ đại', count: 16 },
  { label: 'Lịch sử trung đại', count: 21 },
  { label: 'Lịch sử hiện đại', count: 18 },
  { label: 'Chiến tranh thế giới', count: 12 },
  { label: 'Văn hóa', count: 9 },
];

export const blogPosts: BlogPost[] = [
  {
    slug: 'the-roman-arch-of-empire',
    title: 'Cổng La Mã và sự hình thành không gian đế quốc',
    excerpt:
      'Từ cổng chiến thắng đến quy hoạch thành phố, kiến trúc La Mã đã biến đời sống công cộng thành lời tuyên ngôn quyền lực đầy sân khấu.',
    category: 'Lịch sử cổ đại',
    author: 'Linh Trần',
    date: '19 tháng 4, 2026',
    readTime: '7 phút đọc',
    image:
      'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    accent: 'Đế quốc La Mã',
    content: [
      'Các thành phố La Mã được xây dựng như những công cụ của trật tự: đường sá, quảng trường, hệ thống dẫn nước và các cổng vòm sắp xếp thành phố như một cỗ máy đồng bộ cho quản lý và nghi lễ.',
      'Cổng vòm không chỉ là nơi bắc qua một khoảng trống. Nó đánh dấu một ngưỡng chuyển tiếp, định hướng chuyển động và biến quyền lực thành thứ hiện hữu trong đá. Một người đi qua cổng chiến thắng không chỉ đi qua thành phố; họ đang bước vào một câu chuyện về chinh phục và sự nối tiếp.',
      'Những gì còn lại trong tàn tích không chỉ là kỹ thuật mà còn là một ngôn ngữ chính trị. Đài tưởng niệm mang tính bền bỉ, hoành tráng và công khai. Ở Rome, kiến trúc của đế quốc được thiết kế để được nhìn thấy, ghi nhớ và lặp lại ở các tỉnh xa thủ đô.',
      'Câu chuyện về không gian La Mã do đó trở thành lịch sử của góc nhìn. Khung cảnh hoành tráng biến quyền lực chính trị thành nhịp điệu nhìn thấy được của chuyển động, cho phép công dân và thần dân cùng trải nghiệm đế quốc như một môi trường sống.',
    ],
  },
  {
    slug: 'silk-road-rituals-and-trade',
    title: 'Nghi lễ Con đường tơ lụa: caravan, lộ trình linh thiêng và trao đổi thường nhật',
    excerpt:
      'Sớm hơn rất nhiều so với ý niệm toàn cầu hiện đại, thương nhân và hành giả đã hình thành mạng lưới tin cậy, niềm tin và hàng hóa.',
    category: 'Lịch sử trung đại',
    author: 'Daniel Wu',
    date: '06 tháng 4, 2026',
    readTime: '9 phút đọc',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    accent: 'Mạng lưới thương mại',
    content: [
      'Con đường tơ lụa không bao giờ là một con đường đơn lẻ mà là một bản khảm của các tuyến, thị trấn oáz, cảng biển và các điểm trao đổi. Nó kết nối các đế quốc và cộng đồng thông qua chuyển động, không chỉ là thương mại.',
      'Trên những tuyến đường ấy, sự tin cậy quan trọng bằng lụa hay gia vị. Các trạm nghỉ caravan trở thành không gian thương lượng; các chợ trở thành nơi ngôn ngữ, luật lệ và tín ngưỡng gặp nhau trên cùng một nền tảng.',
      'Những người hành hương và thương nhân di chuyển song song, mang theo văn bản, di vật và ý tưởng. Vì vậy, tuyến đường này vừa là kinh tế vừa là văn hóa. Nó giúp thế giới trở nên dễ đọc từ một góc khác và mở rộng cái mà người ta xem là địa phương và toàn cầu.',
      'Di sản lâu bền của Con đường tơ lụa không chỉ là hàng hóa vượt biên giới. Đó là cách con người học cách xây dựng cuộc sống qua khoảng cách, giữ gìn ký ức và thích nghi với nhịp điệu của thương mại.',
    ],
  },
  {
    slug: 'voyager-letters-and-civilizations',
    title: 'Thư từ người hành trình và ký ức dài của các thế giới đại dương',
    excerpt:
      'Trên biển cả, thư từ, bản đồ và trao đổi ngoại giao đã nối những thế giới từng rất ít khi được tưởng tượng như một.',
    category: 'Lịch sử hiện đại',
    author: 'Amelia Brooks',
    date: '29 tháng 3, 2026',
    readTime: '6 phút đọc',
    image:
      'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80',
    accent: 'Tiếp xúc toàn cầu',
    content: [
      'Thời kỳ mở rộng đại dương không chỉ là câu chuyện về chinh phục và định hướng. Nó cũng là câu chuyện về thư từ: thư, nhật ký, lời khai và nhật trình của các con tàu di chuyển trên biển.',
      'Những hồ sơ này cho thấy một lịch sử không đều, gần gũi hơn nhiều so với các câu chuyện đơn giản hóa về đế quốc. Chúng cho thấy chuyên môn địa phương, ngoại giao và khả năng thích ứng đã định hình sự tiếp xúc giữa các nền văn minh.',
      'Bản đồ không chỉ còn là hướng dẫn khi được đọc cùng với thư từ. Nó trở thành một lập luận về quyền lực, rủi ro và khả năng. Mỗi chuyến đi mang theo một dòng chứng từ quan trọng như chính hàng hóa trên tàu.',
      'Ký ức về những cuộc gặp gỡ ấy vẫn sống trong lưu trữ, trong ngôn ngữ đã biến đổi và trong văn hóa vật chất tiếp tục vượt biển ngày nay.',
    ],
  },
  {
    slug: 'battlefield-archives',
    title: 'Lưu trữ chiến trường: vì sao lịch sử chiến tranh được viết bằng những mảnh vỡ',
    excerpt:
      'Chiến tranh để lại những vật thể—thư tay, bản đồ chiến trường, giấy lương thực và ảnh mờ—vẫn tiếp tục nói lên điều gì đó trong khoảng lặng giữa các trận đánh.',
    category: 'Chiến tranh thế giới',
    author: 'Mikhail Petrov',
    date: '18 tháng 3, 2026',
    readTime: '8 phút đọc',
    image:
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
    accent: 'Ký ức chiến tranh',
    content: [
      'Lưu trữ chiến tranh hiếm khi hoàn chỉnh. Chúng được tập hợp từ những mảnh vỡ: ghi chép rách nát, bản phác thảo chiến trường, giấy tờ của người lính bình thường và ảnh mờ của một thị trấn bỏ hoang.',
      'Chính sự không hoàn chỉnh ấy mới làm cho chúng hữu lực. Một mảnh vỡ buộc các nhà sử học phải đặt câu hỏi: thứ gì được giữ lại, thứ gì bị quên lãng và vì sao sự bảo tồn đó lại diễn ra như vậy.',
      'Những vật thể chúng ta tìm thấy không phải là bản ghi trung tính. Chúng là chứng cứ cho điều kiện sống—nỗi sợ hãi, thói quen, sự xoay xở và sự kiên cường. Ý nghĩa của chúng nảy sinh từ mối quan hệ giữa văn bản và thân thể mang nó đi.',
      'Đọc lưu trữ chiến trường tốt là phải lắng nghe sự im lặng nhiều như lắng nghe lời chứng. Những khoảng trống trở thành một phần của câu chuyện.',
    ],
  },
  {
    slug: 'the-art-of-memory',
    title: 'Nghệ thuật ký ức: cách các nền văn minh bảo tồn bản sắc trong đá và câu chuyện',
    excerpt:
      'Khắp thời cổ đại, ký ức được lưu trữ trong các di tích, nghi lễ và biểu diễn nhiều hơn là chỉ trong chữ viết.',
    category: 'Văn hóa',
    author: 'Sara Nguyen',
    date: '03 tháng 3, 2026',
    readTime: '5 phút đọc',
    image:
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80',
    accent: 'Ký ức văn hóa',
    content: [
      'Việc bảo tồn bản sắc thường dựa vào các thể chế không thuần túy mang tính văn chương: đền thờ, bức tượng, lễ hội và vật dụng nghi lễ đều gánh nhiệm vụ ghi nhớ.',
      'Ký ức trong văn hóa là hiện thân. Nó sống trong sự lặp lại, cử chỉ và các hình thái vật chất mà một cộng đồng dùng để đánh dấu sự liên tục qua các thế hệ.',
      'Đó là lý do một thành phố có thể mang theo lịch sử tập thể không chỉ trong sách vở, mà còn trong lịch lễ, nghi thức công cộng và các hình motif lặp đi lặp lại qua hàng thế kỷ.',
      'Để hiểu lịch sử, do đó, không chỉ cần biết điều gì đã xảy ra mà còn cần hiểu những hình thức ký ức nào được xem là đáng duy trì.',
    ],
  },
  {
    slug: 'four-kingdoms-of-early-asia',
    title: 'Bốn vương quốc châu Á sơ kỳ và quỹ đạo dài của sự trao đổi',
    excerpt:
      'Khắp châu Á sơ kỳ, các quốc gia lân cận được kết nối bởi ngoại giao, hệ thống sông ngòi và tham vọng văn hóa, chứ không phải là các vương quốc cô lập.',
    category: 'Lịch sử cổ đại',
    author: 'Haruto Sato',
    date: '21 tháng 2, 2026',
    readTime: '7 phút đọc',
    image:
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
    accent: 'Các quốc gia châu Á sơ kỳ',
    content: [
      'Các vương quốc sơ kỳ của châu Á không phải là đơn vị có ranh giới kín. Lịch sử của chúng gắn liền với di cư, thương mại và cạnh tranh chính trị.',
      'Thung lũng sông, đường đèo và hành lang ven biển khiến trao đổi khu vực trở nên không tránh khỏi. Ý tưởng, công nghệ và xung đột di chuyển nhanh như hàng hóa.',
      'Một bức tranh chính xác hơn sẽ nhìn các vương quốc này như các nút trong mạng lưới quan hệ rộng lớn hơn, chứ không chỉ là trung tâm quyền lực cô lập.',
      'Độ phức tạp ấy chính là lý do câu chuyện của chúng vẫn rất phong phú: mỗi vương quốc đều có tham vọng riêng nhưng cùng tham gia vào một thế giới khu vực rộng lớn.',
    ],
  },
  {
    slug: 'return-of-the-republic',
    title: 'Sự trở lại của cộng hòa và chính trị phục hồi',
    excerpt:
      'Sau biến động, sự khôi phục chính trị thường viết lại ngôn ngữ của tính hợp pháp theo cách đáng để nhìn lại.',
    category: 'Lịch sử hiện đại',
    author: 'Catherine Hall',
    date: '07 tháng 2, 2026',
    readTime: '6 phút đọc',
    image:
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
    accent: 'Tái sinh chính trị',
    content: [
      'Sự phục hồi không bao giờ chỉ là sự trở về đơn giản của trật tự cũ. Đó là sự định nghĩa lại quyền lực, thường qua ngôn ngữ của sự liên tục và cải cách.',
      'Chính trị phục hồi hiện hữu trong những di tích được chọn để tồn tại, những luật được coi là hợp pháp và những chủ thể mà ký ức của họ được cho phép tiếp tục.',
      'Nhiều trường hợp, sự phục hồi không đảo ngược động lực của biến động; nó chỉ tái phân phối chúng. Các thể chế vẫn còn nhưng ý nghĩa của chúng đã đổi khác.',
      'Để hiểu sự trở lại của cộng hòa, vì vậy, là câu hỏi đọc cả lời kể công khai lẫn chi phí chính trị ẩn giấu đằng sau nó.',
    ],
  },
];

export const featuredPost = blogPosts.find((post) => post.featured) ?? blogPosts[0];
export const recentPosts = blogPosts.filter((post) => post.slug !== featuredPost.slug).slice(0, 4);
export const popularPosts = blogPosts.slice(0, 3);
