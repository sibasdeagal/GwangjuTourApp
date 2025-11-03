import React from 'react';

const TourSelectionPage = ({ onNavigateToHome, onNavigateToPage }) => {

  // 외부 투어 데이터
  const tours = {
    all: [
      {
        id: 1,
        name: '작가와 함께 하는 동구 예술여행 야행',
        company: '광주광역시 동구문화관광재단',
        price: '무료',
        duration: '1시간 40분',
        rating: 4.8,
        reviews: 156,
        description: '여행가는 달, 9월 생활관광자를 위한 야행투어입니다. 여행 전문 작가와 함께 듣고, 보고, 체험하는 밤의 별 투어',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/2762.png',
        spots: ['빛의 음악분수', '빛의 읍성', '전일빌딩245', '리얼월드 팝업스토어', '뷰폴리', '금남 나비정원', '대인야시장'],
        benefits: ['리얼월드 스마트관광 체험', '전문 작가 가이드', '야시장 유료 체험 이벤트 참여']
      },
      {
        id: 2,
        name: '광주세계양궁선구권대회 관광안내소 스마트관광 체험신청',
        company: '광주광역시',
        price: '무료',
        duration: '20분',
        rating: 4.8,
        reviews: 234,
        description: 'AR 기술을 활용한 메타버스형 활체험과 오겜월드 게임 이벤트, 퀴즈 타임을 즐길 수 있는 스마트관광 체험입니다',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/tour_product_4028/1200x720_20250912_094108.webp',
        spots: ['광주 찾아가는 관광안내소'],
        benefits: ['AR 활체험', '오겜월드 게임', '퀴즈 이벤트', '기념품 증정']
      },
      {
        id: 3,
        name: '사직공원 전망대, 또 다른 첨성대로',
        company: '광주광역시',
        price: '25,000원',
        duration: '2시간',
        rating: 4.7,
        reviews: 189,
        description: '사직동 전망대에서 망원경을 통해 알아보는 별자리 체험',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1500.webp',
        spots: ['사직공원 전망대'],
        benefits: ['망원경 체험', '별자리 관측', '전문 해설', '무료 참여']
      },
      {
        id: 4,
        name: '멍 때리기 대회',
        company: '광주광역시',
        price: '3,000원',
        duration: '2시간',
        rating: 4.5,
        reviews: 156,
        description: '바쁜 일상 속에서 자기만의 시간을 가지기가 어려우신 분들! 열심히 멍 때려보세요!',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1498.webp',
        spots: ['광주시청 앞 잔디밭'],
        benefits: ['마음의 평정', '스트레스 해소', '자기 시간', '무료 참여']
      },
      {
        id: 5,
        name: '위스키 입문자 1일 클래스',
        company: '애프터워크',
        price: '50,000원',
        duration: '2시간',
        rating: 4.6,
        reviews: 89,
        description: '최근 각광 받고 있는 위스키, 입문자에게 맞는 위스키와 마시는 법을 배워봅니다.',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1501.webp',
        spots: ['애프터워크'],
        benefits: ['위스키 교육', '시음 체험', '전문 강사', '무료 참여']
      },
      {
        id: 6,
        name: '북구상생 힐링투어 트립 투 메모리',
        company: '광주광역시 북구',
        price: '무료',
        duration: '6시간',
        rating: 4.7,
        reviews: 124,
        description: '광주디자인비엔날레, 남도향토음식박물관, 말바우시장을 둘러보는 북구상생 힐링투어',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXORION/tour_product_4012/1200x720_%EC%98%A4%ED%94%8C%ED%88%AC%20%ED%8A%B8%EB%A6%BD%ED%88%AC%EB%A9%94%EB%AA%A8%EB%A6%AC-07.webp',
        spots: ['광주디자인비엔날레', '남도향토음식박물관', '말바우시장'],
        benefits: ['힐링 투어', '자연 체험', '추억 만들기', '무료 참여']
      },
      {
        id: 7,
        name: '야외러닝 트립 "광주천번 RUN"',
        company: '오리온플래닛투어',
        price: '20,000원',
        duration: '2시간',
        rating: 4.6,
        reviews: 98,
        description: '광주천변 야경속에서 달리자 : 도심 속 힐링 런닝 투어',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXORION/tour_product_395/1200x720_a47ae7bfa012a.webp',
        spots: ['광주천'],
        benefits: ['야경 런닝', '힐링 체험', '전문 코치', '무료 참여']
      },
      {
        id: 8,
        name: '스리술쩍 미슐랭트립 광주의 숨은 술을 찾아보자',
        company: '오리온플래닛투어',
        price: '20,000원',
        duration: '3시간',
        rating: 4.5,
        reviews: 87,
        description: '주당과 함께하는 스리술쩍 미슐랭트립 광주의 숨은 술을 찾아서',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXORION/tour_product_396/1200x720_a89e0e9174dfc.webp',
        spots: ['광주 숨은 술집'],
        benefits: ['주당 가이드', '미슐랭 술집 탐방', '지역 술 문화 체험', '무료 참여']
      },
      {
        id: 9,
        name: '사디코 러닝트립 전문러너 DJ동행합니다',
        company: '오리온플래닛투어',
        price: '20,000원',
        duration: '2시간',
        rating: 4.4,
        reviews: 76,
        description: '이색적인 러닝을 즐기다 국립아시아 문화전당에서 펼쳐지는 사디코러닝',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXORION/tour_product_394/1200x720_ec661b8580e92.webp',
        spots: ['국립아시아문화전당'],
        benefits: ['전문러너 DJ 동행', '사디코 러닝', '문화전당 체험', '무료 참여']
      },
      {
        id: 10,
        name: '광주사람도 모르는 동명동 힙플 투어! 광주 워킹 카페 투어!',
        company: '애프터워크',
        price: '25,000원',
        duration: '3시간',
        rating: 4.3,
        reviews: 92,
        description: '워킹 카페투어프로그램으로 동명동 카페를 탐방하고 참여자들과 함께 시음해봅니다!',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1469.webp',
        spots: ['동명동 카페골목'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 11,
        name: '어썸투어 "여수시" 편',
        company: '애프터워크',
        price: '250,000원',
        duration: '1박 2일',
        rating: 4.3,
        reviews: 92,
        description: '광주에서 출발하는 여수시 캠핑낚시투어!',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1506.webp',
        spots: ['여수시'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 12,
        name: '어썸투어 "신안군" 편',
        company: '애프터워크',
        price: '250,000원',
        duration: '1박 2일',
        rating: 4.3,
        reviews: 92,
        description: '광주에서 출발하는 신안군 생태관광투어!',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1507.webp',
        spots: ['신안군'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 13,
        name: '광주 맛있는 등산',
        company: '애프터워크',
        price: '89,000원',
        duration: '5시간 30분',
        rating: 4.3,
        reviews: 92,
        description: '100대 명산 중 하나인 무등산에서 즐기는 등산 + 맛집 탐방!',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/tour_product_303/1200x720_Untitled-1.jpg',
        spots: ['무등산'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 14,
        name: '말바우 전통시장에서 즐기는 푸드트립',
        company: '애프터워크',
        price: '58,000원',
        duration: '3시간',
        rating: 4.3,
        reviews: 92,
        description: '말바우 전통시장에서 동네 AR과 함께 즐기는 말바우 푸드로드트립 광주 전통시장 남도의 맛 시장 투어 동네라이프 AR 메타아처 퇴근후 즐기는 맛집기행',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/tour_product_309/1200x720_2223.jpg',
        spots: ['말바우 시장'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 15,
        name: '광주FC 선수 훈련 체험',
        company: '애프터워크',
        price: '50,000원',
        duration: '5시간',
        rating: 4.3,
        reviews: 92,
        description: '광주FC 프로 선수들은 어떤 훈련을 받을까요? 축구에 관심 있는 분들의 능력을 키워줄 프로그램',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1409.webp',
        spots: ['전남대학교 제 2운동장'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 16,
        name: '1박2일 온천수 물놀이 패키지',
        company: '애프터워크',
        price: '65,000원',
        duration: '1박 2일',
        rating: 4.3,
        reviews: 92,
        description: '화순 금호 아쿠아나에서 온천수로 즐기는 당일치기 물놀이 패키지(수영장+온천)',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1401.webp',
        spots: ['화순군'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 17,
        name: '온천 투어 패키지',
        company: '애프터워크',
        price: '48,000원',
        duration: '5시간',
        rating: 4.3,
        reviews: 92,
        description: '담양 명소 담양 온천에서 건강도 챙기고, 담양식 돼지갈비도 맛보는 맛있는 헬스케어 투어',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1400.webp',
        spots: ['담양군'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 18,
        name: '광주천 힐링 바이크 투어',
        company: '애프터워크',
        price: '35,000원',
        duration: '6시간',
        rating: 4.3,
        reviews: 92,
        description: '타랑께를 타고 광주천을 가로질러 광주천 거점별 투어를 진행합니다.',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1410.webp',
        spots: ['광주시청', '광주 기아 챔피언스 필드', '양동시장', '아시아문화전당'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 19,
        name: '광주 예술 투어',
        company: '애프터워크',
        price: '40,000원',
        duration: '7시간',
        rating: 4.3,
        reviews: 92,
        description: '예술버스투어 프로그램으로 광주 문화예술을 체험하는 원데이 투어!',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1468.webp',
        spots: ['국립 아시아 문화거리', '펭귄마을'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 20,
        name: '[퇴근후 프로젝트] 야시장 마스터',
        company: '애프터워크',
        price: '25,000원',
        duration: '2시간',
        rating: 4.3,
        reviews: 92,
        description: '퇴근후 야시장 마스터 크루원을 모집합니다!',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1489.webp',
        spots: ['대인시장'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 21,
        name: '직접 만드는 김치 클래스',
        company: '애프터워크',
        price: '25,000원',
        duration: '4시간',
        rating: 4.3,
        reviews: 92,
        description: '내가 직접 만들어 먹는 건강한 김치(원재료 현장 구매)',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1435.webp',
        spots: ['광주김치타운'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 22,
        name: '동화 마을 포토워킹',
        company: '애프터워크',
        price: '39,000원',
        duration: '6시간',
        rating: 4.3,
        reviews: 92,
        description: '동심 가득한 마을에서 인생샷 건지는 워킹 프로그램!',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/tour_product_308/1200x720_Untitled-3.jpg',
        spots: ['동화마을'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 23,
        name: '자연 속 야외 요가',
        company: '애프터워크',
        price: '56,000원',
        duration: '2시간 30분',
        rating: 4.3,
        reviews: 92,
        description: '도심 속 자연에서 요가를 경험해보는 프로그램입니다.',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/tour_product_302/1200x720_011.jpg',
        spots: ['용봉초록습지'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 24,
        name: '월곡동 세계음식야시장',
        company: '애프터워크',
        price: '30,000원',
        duration: '3시간',
        rating: 4.3,
        reviews: 92,
        description: '광주의 이태원 세계음식문화의거리 월곡동에서 야시장을 즐겨보자',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1441.webp',
        spots: ['월곡동 세계음식문화의거리'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 25,
        name: '광주천 마라톤대회',
        company: '애프터워크',
        price: '5,000원',
        duration: '4시간',
        rating: 4.3,
        reviews: 92,
        description: '광주천을 따라 달리는 광주 시민 10KM 마라톤',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1432.webp',
        spots: ['광주천'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 26,
        name: '에어프라이어 제빵 클래스',
        company: '애프터워크',
        price: '48,000원',
        duration: '2시간',
        rating: 4.3,
        reviews: 92,
        description: '에어프라이어로도 빵을 구울 수 있다는 사실을 알고 계셨나요? 집에서 만들 수 있는 간단 레시피로 나만의 빵을 만들어보세요!',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1505.webp',
        spots: ['애프터워크'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 27,
        name: '광주 체육 대전',
        company: '애프터워크',
        price: '10,000원',
        duration: '9시간',
        rating: 4.3,
        reviews: 92,
        description: '광주 시민 중 이 운동은 내가 제일 잘한다를 가리는, 종목별 체육 대전',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1423.webp',
        spots: ['애프터워크'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 28,
        name: '[전남·광주] 오늘,북구 투어',
        company: '애프터워크',
        price: '47,000원',
        duration: '9시간',
        rating: 4.3,
        reviews: 92,
        description: '광주 북구 대표전통시장인 말바우시장과 디자인비엔날레를 함께 즐길 수 있는 투어!',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1510.webp',
        spots: ['말바우시장', '디자인비엔날레'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 29,
        name: '[전남·광주] 오늘,동구 투어',
        company: '애프터워크',
        price: '47,000원',
        duration: '9시간',
        rating: 4.3,
        reviews: 92,
        description: '광주 동구 대표전통시장인 대인시장과 ACC를 함께 즐길 수 있는 투어!',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1508.webp',
        spots: ['대인시장', 'ACC'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      },
      {
        id: 30,
        name: '[전남·광주] 오늘,서구 투어',
        company: '애프터워크',
        price: '47,000원',
        duration: '9시간',
        rating: 4.3,
        reviews: 92,
        description: '광주 서구 대표전통시장인 양동시장과 양림동을 함께 즐길 수 있는 투어!',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXAFTERW/media_images/1509.webp',
        spots: ['양동시장', '양림동'],
        benefits: ['카페 투어', '커피 시음', '힙플 체험', '무료 참여']
      }
    ],
    history: [
      {
        id: 6,
        name: '북구상생 힐링투어 트립 투 메모리',
        company: '광주광역시 북구',
        price: '무료',
        duration: '6시간',
        rating: 4.7,
        reviews: 124,
        description: '광주디자인비엔날레, 남도향토음식박물관, 말바우시장을 둘러보는 북구상생 힐링투어',
        image: 'https://octopus.gcdn.ntruss.com/OCTOPUS/upload/DXORION/tour_product_4012/1200x720_%EC%98%A4%ED%94%8C%ED%88%AC%20%ED%8A%B8%EB%A6%BD%ED%88%AC%EB%A9%94%EB%AA%A8%EB%A6%AC-07.webp',
        spots: ['광주디자인비엔날레', '남도향토음식박물관', '말바우시장'],
        benefits: ['힐링 투어', '자연 체험', '추억 만들기', '무료 참여']
      }
    ],
    shopping: [
      {
        id: 7,
        name: '광주 백화점 쇼핑 투어',
        company: '광주쇼핑투어',
        price: '40,000원',
        duration: '5시간',
        rating: 4.4,
        reviews: 78,
        description: '신세계백화점, 롯데백화점, 광주세정아울렛을 둘러보는 프리미엄 쇼핑 투어',
        image: '/images/shinsegae_gwangju.jpg',
        spots: ['신세계백화점 광주신세계점', '롯데백화점 광주점', '광주세정아울렛'],
        benefits: ['쇼핑 할인권', '전용 라운지', '배송 서비스']
      }
    ],
    nature: [
      {
        id: 8,
        name: '무등산 등산 투어',
        company: '광주등산클럽',
        price: '18,000원',
        duration: '8시간',
        rating: 4.9,
        reviews: 145,
        description: '무등산 정상을 오르는 본격적인 등산 투어',
        image: '/images/mudeungsan.jpg',
        spots: ['무등산'],
        benefits: ['등산 장비 제공', '점심 제공', '응급 처치']
      }
    ]
  };

  const allTours = tours.all;

  return (
    <>
      {/* 투어 목록 */}
        <div className="tours-container">
          <div className="tours-header">
            <h2 className="section-title">광주/전남 투어</h2>
            <div className="tours-count-header">{allTours.length}개의 투어</div>
          </div>

          <div className="tours-list">
            {allTours.map(tour => (
              <div key={tour.id} className="tour-item">
                <div className="tour-image">
                  <img src={tour.image} alt={tour.name} />
                </div>
                
                <div className="tour-info">
                  <h3 className="tour-name">{tour.name}</h3>
                  <div className="tour-price-row">
                    <div className="tour-price">{tour.price}</div>
                    <button 
                      className="tour-button"
                      onClick={() => onNavigateToPage('tour-detail', tour.id)}
                    >
                      자세히 보기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {allTours.length === 0 && (
            <div className="no-tours">
              <div className="no-tours-icon">🔍</div>
              <h3>투어가 없습니다</h3>
              <p>나중에 다시 확인해주세요</p>
            </div>
          )}
        </div>
    </>
  );
};

export default TourSelectionPage;
