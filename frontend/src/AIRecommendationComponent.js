import React, { useState, useEffect } from 'react';

const AIRecommendationComponent = ({ 
  currentRoute, 
  spots, 
  themes, 
  onRouteSelect,
  onAddToRoute,
  isLoggedIn = false,
  hasSavedRoutes = false,
  onNavigateToMap = null,
  recommendations = null,
  analysis = null,
  onRefresh = null,
  onSaveRoute = null,
}) => {
  const [localRecommendations, setLocalRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localAnalysis, setLocalAnalysis] = useState(null);

  // 루트 추천 (실제 API 호출: 로그인 + 저장된 루트 필요)
  const handleRouteRecommendation = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!isLoggedIn) {
        setLocalRecommendations([]);
        setError('로그인 후 이용해 주세요.');
        return;
      }

      const response = await fetch(`/api/ai/recommendations/routes?limit=5`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        setLocalRecommendations([]);
        setLocalAnalysis(null);
        return;
      }
      setLocalRecommendations(data.recommended_routes || []);
      setLocalAnalysis(data.analysis || null);
          } catch (error) {
        console.error('루트 추천 실패:', error);
        setError('추천 중 오류가 발생했습니다. 다시 시도해 주세요.');
      setLocalRecommendations([]);
    } finally {
      setLoading(false);
    }
  };



  // 테마별 색상 반환
  const getThemeColor = (themeId) => {
    const colors = {
      1: '#FF6B6B',   // 쇼핑
      2: '#4ECDC4',   // 역사
      3: '#45B7D1',   // 문화
      4: '#96CEB4',   // 음식
      5: '#FFEAA7',   // 자연
      6: '#FF9500',   // 체험
      7: '#A8E6CF',   // 숙박
      8: '#9B59B6',   // 근교
    };
    return colors[themeId] || '#4A90E2';
  };

  // 테마 이름 반환
  const getThemeName = (themeId) => {
    const theme = themes.find(t => t.id === themeId);
    return theme ? theme.name : '기타';
  };

  // 스팟 아이콘 반환
  const getSpotIcon = (themeId) => {
    const icons = {
      1: '🛍️',        // 쇼핑
      2: '🏛️',        // 역사
      3: '🎭',        // 문화
      4: '🍜',        // 음식
      5: '🌿',        // 자연
      6: '🏃‍♂️',       // 체험
      7: '🏨',        // 숙박
      8: '🏞️',        // 근교
    };
    return icons[themeId] || '📍';
  };

  // 거리 계산 함수 (지도와 동일)
  const calculateRouteDistance = (spots) => {
    if (spots.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < spots.length - 1; i++) {
      const spot1 = spots[i];
      const spot2 = spots[i + 1];
      
      if (spot1.latitude && spot1.longitude && spot2.latitude && spot2.longitude) {
        const distance = calculateDistance(
          spot1.latitude, spot1.longitude,
          spot2.latitude, spot2.longitude
        );
        totalDistance += distance;
      }
    }
    return totalDistance;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateRouteTime = (distance) => {
    let speed, transportMode;
    
    if (distance <= 5) {
      // 5km 이하: 도보
      speed = 4;
      transportMode = '도보';
    } else if (distance <= 15) {
      // 5-15km: 자전거
      speed = 15;
      transportMode = '자전거';
    } else {
      // 15km 초과: 자동차
      speed = 40;
      transportMode = '자동차';
    }
    
    const timeInHours = distance / speed;
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);
    
    let timeString;
    if (hours === 0) timeString = `${minutes}분`;
    else if (minutes === 0) timeString = `${hours}시간`;
    else timeString = `${hours}시간 ${minutes}분`;
    
    return `${timeString} (${transportMode})`;
  };

  return (
    <div className="recommendation-container">
      <div className="recommendation-header">
      </div>
      

      {/* 루트 추천 버튼 */}
      <div className="recommendation-types">
        <button 
          className={`type-button ${isLoggedIn ? 'active' : 'disabled'}`}
          onClick={onRefresh || handleRouteRecommendation}
          disabled={!isLoggedIn || loading}
        >
          루트 추천
        </button>
      </div>

      {/* 추천 결과 */}
      {(recommendations || localRecommendations).length > 0 && (
        <div className="recommendations-section">
          <h3 className="section-title">
            추천하는 맞춤형 루트
          </h3>
          
          {/* 분석 정보 표시 */}
          {(analysis || localAnalysis) && (
            <div className="analysis-info">
              <p className="analysis-text">
                <strong>"{(analysis || localAnalysis).based_on_route}"</strong> 루트를 분석하여 추천했습니다
              </p>
              <div className="analysis-details">
                <span className="analysis-detail">관광지 개수: {(analysis || localAnalysis).spot_count}개</span>
                <span className="analysis-detail">
                  테마 패턴: {Object.entries((analysis || localAnalysis).theme_pattern).map(([theme_id, count]) => {
                    const themeNames = {1: '쇼핑', 2: '역사', 3: '문화', 4: '음식', 5: '자연', 6: '체험', 7: '숙박', 8: '근교'};
                    return `${themeNames[theme_id] || '기타'} ${count}개`;
                  }).join(', ')}
                </span>
              </div>
            </div>
          )}
          
          <div className="recommendations-list">
            {(recommendations || localRecommendations).map((item) => (
              <div key={item.id} className="recommendation-card">
                <div className="recommendation-header">
                  <h4 className="recommendation-title">{item.name}</h4>
                </div>
                
                <div className="route-info">
                  <p className="route-description">{item.description}</p>
                  <div className="route-stats">
                    <span className="route-stat">
                      {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} · 
                      {calculateRouteTime(calculateRouteDistance(item.spots))} · 
                      {calculateRouteDistance(item.spots).toFixed(1)}km
                    </span>
                  </div>
                </div>
                
                {/* 루트 추천인 경우 관광지 목록 표시 */}
                {item.spots && (
                  <div className="recommendation-spots">
                    {item.spots.map((spot, index) => (
                      <div key={spot.id} className="recommendation-spot">
                        <span className="spot-number">{index + 1}</span>
                        <span className="spot-theme">{getThemeName(spot.theme_id)}</span>
                        <span className="spot-name">{spot.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="recommendation-actions">
                  <button 
                    className="view-route-button"
                    onClick={async () => {
                      // 추천 루트를 실제로 저장
                      if (onSaveRoute && item.spots) {
                        try {
                          const success = await onSaveRoute(item.name, item.spots);
                          if (success) {
                            alert('추천 루트가 저장되었습니다!');
                            // 프로필 페이지에서 대기 (지도 페이지로 이동하지 않음)
                          }
                        } catch (error) {
                          alert('루트 저장에 실패했습니다.');
                        }
                      }
                    }}
                  >
                    루트 저장
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div className="loading-container">
          <div className="loading-text">루트를 분석하고 있습니다...</div>
        </div>
      )}

      {/* 초기 안내 */}
      {!loading && (recommendations || localRecommendations).length === 0 && (
        <div className="initial-guide">
          {!isLoggedIn ? (
            <p className="guide-text">로그인 후 루트 추천을 이용할 수 있습니다.</p>
          ) : !hasSavedRoutes ? (
            <>
              <p className="guide-text">루트 추천을 받으려면 먼저 루트를 만들어주세요!</p>
              <p className="guide-subtext">관광지 선택 후 루트 저장하면 유사한 루트를 추천합니다.</p>
            </>
          ) : (
            <>
              <p className="guide-text">루트 추천 버튼을 클릭하여 맞춤형 루트를 받아보세요!</p>
              <p className="guide-subtext">루트 추천: 마지막 루트 패턴 분석 기반 추천</p>
            </>
          )}
          {error && <p className="guide-error">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default AIRecommendationComponent;
