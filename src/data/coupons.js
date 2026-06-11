import {
    faUtensils, faCut, faGlassCheers,
    faSpa, faHeart, faStethoscope, faBuilding, faMotorcycle, faFire,
    faCoffee, faShoppingCart, faHospital, faHotel, faGraduationCap,
    faGolfBall, faCar, faTools, faTshirt, faFutbol, faEllipsisH
} from '@fortawesome/free-solid-svg-icons';

export const categories = [
    {
        id: 'dining',
        name: { ko: '식당/음식', en: 'Dining/FB', vi: 'Nhà hàng/Ẩm thực', zh: '餐饮/食品' },
        icon: faUtensils,
        keywords: ['음식', '음식점', '맛집', '먹거리', '식당', '식사', '레스토랑', '요리', '분식', '양식', '중국요리', '한식', '일식', '외식', 'nhà hàng', 'quán ăn', 'ẩm thực', 'món ăn', 'ăn uống', 'buffet', 'lẩu', 'nướng']
    },
    {
        id: 'cafe',
        name: { ko: '카페/베이커리', en: 'Cafe/Bakery', vi: 'Cà phê/Tiệm bánh', zh: '咖啡/烘焙' },
        icon: faCoffee,
        keywords: ['커피', '카페', '베이커리', '디저트', 'cà phê', 'tiệm bánh']
    },
    {
        id: 'mart',
        name: { ko: '마트/편의점', en: 'Mart/Convenience', vi: 'Siêu thị/Tiện lợi', zh: '超市/便利店' },
        icon: faShoppingCart,
        keywords: ['마트', '편의점', '쇼핑', 'siêu thị']
    },
    {
        id: 'beauty',
        name: { ko: '미용/헤어', en: 'Beauty/Hair', vi: 'Làm đẹp/Tóc', zh: '美容/美发' },
        icon: faCut,
        keywords: ['미용실', '바디', '이발소', '이발', '손톱', '헤어', '메이크업', '얼굴', '화장품', 'làm đẹp', 'cắt tóc', 'spa', 'nail', 'móng tay', 'trang điểm', 'salon', 'tiệm tóc']
    },
    {
        id: 'massage',
        name: { ko: '마사지/스파', en: 'Massage/Spa', vi: 'Massage/Spa', zh: '按摩/水疗' },
        icon: faSpa,
        keywords: ['마사지', 'massage', '건전마사', '휴식', 'mát xa', 'thư giãn', 'tẩm quất', 'xông hơi']
    },
    {
        id: 'medical',
        name: { ko: '의료/약국', en: 'Medical/Pharmacy', vi: 'Y tế/Nhà thuốc', zh: '医疗/药店' },
        icon: faHospital,
        keywords: ['병원', '의사', '진료', '치과', '내과', '성형', 'bệnh viện', 'bác sĩ', 'khám bệnh', 'nha khoa']
    },
    {
        id: 'hospital',
        name: { ko: '병원', en: 'Hospital', vi: 'Bệnh viện', zh: '医院' },
        icon: faStethoscope,
        keywords: ['병원', '의사', '진료', '치과', '내과', '성형', 'bệnh viện', 'bác sĩ', 'khám bệnh', 'nha khoa']
    },
    {
        id: 'hotel',
        name: { ko: '호텔/숙박', en: 'Hotel/Stay', vi: 'Khách sạn/Lưu trú', zh: '酒店/住宿' },
        icon: faHotel,
        keywords: ['호텔', '숙박', '여행', 'khách sạn']
    },
    {
        id: 'academy',
        name: { ko: '학원/교육', en: 'Academy/Edu', vi: 'Học viện/Giáo dục', zh: '学院/教育' },
        icon: faGraduationCap,
        keywords: ['학원', '교육', '강의', '학교', 'trường học']
    },
    {
        id: 'golf',
        name: { ko: '레저/골프', en: 'Leisure/Golf', vi: 'Giải trí/Golf', zh: '休闲/高尔夫' },
        icon: faGolfBall,
        keywords: ['골프', 'golf', 'sân golf']
    },
    {
        id: 'travel',
        name: { ko: '여행/렌트카', en: 'Travel/Car Rent', vi: 'Du lịch/Thuê xe', zh: '旅游/租车' },
        icon: faCar,
        keywords: ['여행', '관광', '렌트카', 'du lịch']
    },
    {
        id: 'fashion',
        name: { ko: '패션/잡화', en: 'Fashion/Accessory', vi: 'Thời trang/Phụ kiện', zh: '服装/服饰' },
        icon: faTshirt,
        keywords: ['의류', '패션', '잡화', '쇼핑', 'quần áo', 'thời trang']
    },
    {
        id: 'sports',
        name: { ko: '스포츠', en: 'Sports', vi: 'Thể thao', zh: '体育' },
        icon: faFutbol,
        keywords: ['스포츠', '운동', '체육', 'thể thao']
    },
    {
        id: 'service',
        name: { ko: '생활/서비스', en: 'Life/Service', vi: 'Đời sống/Dịch vụ', zh: '生活/服务' },
        icon: faTools,
        keywords: ['생활', '서비스', '수리', '이사', 'dịch vụ']
    },
    {
        id: 'nightlife',
        name: { ko: '유흥', en: 'Nightlife', vi: 'Giải trí về đêm', zh: '夜生活' },
        icon: faGlassCheers,
        keywords: ['가라오케', 'KTV', '술집', '맥주', '소주', '양주', '주점', '노래방', 'bar', 'karaoke', 'ktv', 'bia', 'rượu', 'club', 'quán nhậu']
    },
    {
        id: 'estate',
        name: { ko: '부동산', en: 'Real Estate', vi: 'Bất động sản', zh: '房地产' },
        icon: faBuilding,
        keywords: ['부동산', '월세', '아파트', '집', '임대', '전세', '매매', 'bất động sản', 'thuê nhà', 'căn hộ', 'chung cư', 'nhà đất', 'phòng trọ', 'mua bán nhà']
    },
    {
        id: 'other',
        name: { ko: '기타', en: 'Other', vi: 'Khác', zh: '其他' },
        icon: faEllipsisH,
        keywords: ['기타', 'khác']
    },
    {
        id: 'etc',
        name: { ko: '기타', en: 'Other', vi: 'Khác', zh: '其他' },
        icon: faEllipsisH,
        keywords: ['기타', 'khác']
    }
];

export const coupons = [
    {
        id: 1,
        name: { ko: "K-BBQ 마스터", en: "K-BBQ Master", vi: "Master K-BBQ", zh: "K-BBQ 大师" },
        category: "dining",
        location: { ko: "푸미흥", en: "Phu My Hung", vi: "Phú Mỹ Hưng", zh: "富美兴" },
        discount: { ko: "20% 할인", en: "20% OFF", vi: "Giảm 20%", zh: "20% 折扣" },
        description: { ko: "프리미엄 와규 세트 메뉴", en: "Premium Wagyu Set Menu", vi: "Thực đơn Set Bò Wagyu cao cấp", zh: "尊享和牛套餐" },
        image: "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        validUntil: "2024-12-31",
        phoneNumber: "028 5412 1234"
    },
    {
        id: 2,
        name: { ko: "골든 로터스 스파", en: "Golden Lotus Spa", vi: "Golden Lotus Spa", zh: "金莲花水疗中心" },
        category: "beauty",
        location: { ko: "타오디엔", en: "Thao Dien", vi: "Thảo Điền", zh: "草甸" },
        discount: { ko: "1+1 행사", en: "1+1 Event", vi: "Sự kiện 1+1", zh: "1+1 活动" },
        description: { ko: "시그니처 바디 마사지 (90분)", en: "Signature Body Massage (90min)", vi: "Massage cơ thể Signature (90 phút)", zh: "特色全身按摩（90分钟）" },
        image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        validUntil: "2024-11-30",
        phoneNumber: "090 123 4567"
    },
    {
        id: 3,
        name: { ko: "서울 아카데미", en: "Seoul Academy", vi: "Seoul Academy", zh: "首尔学院" },
        category: "education",
        location: { ko: "푸미흥", en: "Phu My Hung", vi: "Phú Mỹ Hưng", zh: "富美兴" },
        discount: { ko: "무료 체험", en: "Free Trial", vi: "Dùng thử miễn phí", zh: "免费试用" },
        description: { ko: "유아 코딩 클래스 1주일 무료", en: "Preschool Coding Class 1 Week Free", vi: "Lớp học lập trình mẫu giáo miễn phí 1 tuần", zh: "学前班编程课 1 周免费" },
        image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        validUntil: "2024-10-15",
        phoneNumber: "028 4444 5555"
    },
    {
        id: 4,
        name: { ko: "오션 커피", en: "Ocean Coffee", vi: "Ocean Coffee", zh: "海洋咖啡" },
        category: "dining",
        location: { ko: "빈탄", en: "Binh Thanh", vi: "Bình Thạnh", zh: "平盛" },
        discount: { ko: "10% 할인", en: "10% OFF", vi: "Giảm 10%", zh: "10% 折扣" },
        description: { ko: "모든 음료 포함", en: "Including all drinks", vi: "Bao gồm tất cả đồ uống", zh: "包含所有饮品" },
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        validUntil: "2024-12-01",
        phoneNumber: "091 888 7777"
    },
    {
        id: 5,
        name: { ko: "필라테스 스튜디오 H", en: "Pilates Studio H", vi: "Pilates Studio H", zh: "普拉提工作室 H" },
        category: "beauty",
        location: { ko: "타오디엔", en: "Thao Dien", vi: "Thảo Điền", zh: "草甸" },
        discount: { ko: "30% 할인", en: "30% OFF", vi: "Giảm 30%", zh: "30% 折扣" },
        description: { ko: "첫 방문 개인 레슨 할인", en: "First visit private lesson discount", vi: "Giảm giá bài học riêng lần đầu tiên", zh: "首次访问私人课程折扣" },
        image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        validUntil: "2024-09-30",
        phoneNumber: "093 333 9999"
    },
    {
        id: 6,
        name: { ko: "자금성", en: "Forbidden City", vi: "Tử Cấm Thành", zh: "紫禁城" },
        category: "dining",
        location: { ko: "푸미흥", en: "Phu My Hung", vi: "Phú Mỹ Hưng", zh: "富美兴" },
        discount: { ko: "군만두 서비스", en: "Free Dumplings", vi: "Khuyến mãi sủi cảo", zh: "免费饺子" },
        description: { ko: "탕수육 대(L) 주문 시 무료 증정", en: "Free when ordering Sweet and Sour Pork Large(L)", vi: "Tặng miễn phí khi gọi Heo xào chua ngọt cỡ lớn(L)", zh: "订购大份糖醋肉时免费赠送" },
        image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        validUntil: "2024-12-31",
        phoneNumber: "028 7777 1234"
    },
    {
        id: 7,
        name: { ko: "골프존여기로",
                en: "Golfzon Here",
                vi: "Golfzon Ở Đây",
                zh: "高尔夫地带这里" },
        category: "living",
        location: { ko: "타오디엔", en: "Thao Dien", vi: "Thảo Điền", zh: "草甸" },
        discount: { ko: "오전 게임 30% 할인", en: "30% off morning games", vi: "Giảm 30% trò chơi buổi sáng", zh: "上午游戏 30% 折扣" },
        description: { ko: "최신 투비전 기기 완비 (평일 오전 한정)", en: "Equipped with latest Two-Vision devices (Weekdays AM only)", vi: "Trang bị thiết bị Two-Vision mới nhất (Chỉ sáng ngày thường)", zh: "配备最新的 Two-Vision 设备（仅限工作日上午）" },
        image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        validUntil: "2024-11-15",
        phoneNumber: "090 999 8888"
    },
    {
        id: 8,
        name: { ko: "소판돈판", en: "Beef and Pork", vi: "Bò và Heo", zh: "牛和猪" },
        category: "dining",
        location: { ko: "빈탄", en: "Binh Thanh", vi: "Bình Thạnh", zh: "平盛" },
        discount: { ko: "육회 1접시 무료", en: "1 plate of Beef Tartare free", vi: "Tặng 1 đĩa bò tái", zh: "免费送 1 盘生牛肉" },
        description: { ko: "모듬 스페셜 세트 주문 시 제공", en: "Provided when ordering Assorted Special Set", vi: "Cung cấp khi gọi Set Đặc biệt Tổng hợp", zh: "订购什锦特别套餐时提供" },
        image: "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        validUntil: "2024-12-25",
        phoneNumber: "093 555 4444"
    }
];
