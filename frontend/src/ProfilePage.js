import React, { useState, useEffect } from 'react';
import AIRecommendationComponent from './AIRecommendationComponent';

const ProfilePage = ({ 
  onBack, 
  onNavigateToHome, 
  spots, 
  themes, 
  isLoggedIn, 
  routes, 
  onLogin, 
  onLogout, 
  onRegister, 
  onNavigateToMap, 
  aiRecommendations, 
  aiAnalysis, 
  onRefreshAI, 
  onAddToRoute, 
  onSaveRoute, 
  onDeleteRoute, 
  onRouteUpdate, 
  onProfileUpdate,
  editingRoute,
  setEditingRoute,
  editingSpots,
  setEditingSpots,
  editingRouteName,
  setEditingRouteName,
  editRouteNameModalVisible,
  setEditRouteNameModalVisible,
  addSpotSearch,
  setAddSpotSearch,
  onSaveEditing,
  onCancelEditing,
  onAddSpotToEditing,
  onRemoveSpotFromEditing,
  getThemeNameById,
  getSpotIcon,
  calculateRouteTime,
  calculateRouteDistance
}) => {
  const [profile, setProfile] = useState(null);
  const [myRoutes, setMyRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingLoading, setEditingLoading] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);
  
  


  // 프로필 정보 가져오기
  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile', { 
        credentials: 'include' 
      });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('프로필 조회 실패:', err);
      setError('프로필 정보를 불러올 수 없습니다.');
    }
  };

  // 내 루트 목록 가져오기 (App.js와 동일한 방식)
  const fetchMyRoutes = async () => {
    try {
      const response = await fetch('/api/routes', { credentials: 'include' });
      if (response.status === 401) {
        setError('로그인이 필요합니다');
        return;
      }
      const data = await response.json();
      if (data.routes) {
        // 각 루트의 상세(관광지들)까지 함께 불러와서 저장
        const detailedRoutes = await Promise.all(
          data.routes.map(async (r) => {
            try {
              const detailRes = await fetch(`/api/routes/${r.id}`, { credentials: 'include' });
              const detail = await detailRes.json();
              if (detail && detail.spots) {
                return {
                  id: r.id,
                  name: r.name,
                  spots: detail.spots,
                  created_at: r.created_at
                };
              }
            } catch (e) {
              console.error('루트 상세 조회 실패:', e);
            }
            return { id: r.id, name: r.name, spots: [], created_at: r.created_at };
          })
        );
        setMyRoutes(detailedRoutes);
      }
    } catch (err) {
      console.error('내 루트 조회 실패:', err);
      setError('내 루트 목록을 불러올 수 없습니다.');
    }
  };

  // 루트 삭제
  const deleteRoute = async (routeId) => {
    if (!window.confirm('정말로 이 루트를 삭제하시겠습니까?')) {
      return;
    }

    if (onDeleteRoute) {
      // 즉시 UI에서 루트 제거 (낙관적 업데이트)
      setMyRoutes(prevRoutes => prevRoutes.filter(route => route.id !== routeId));
      
      const success = await onDeleteRoute(routeId);
      if (success) {
        alert('루트가 삭제되었습니다.');
        fetchProfile(); // 통계 업데이트
      } else {
        // 삭제 실패 시 원래 상태로 복원
        fetchMyRoutes();
        alert('루트 삭제에 실패했습니다.');
      }
    } else {
      // 기존 로직 (fallback)
      // 즉시 UI에서 루트 제거 (낙관적 업데이트)
      setMyRoutes(prevRoutes => prevRoutes.filter(route => route.id !== routeId));
      
      try {
        let response = await fetch(`/api/routes/${routeId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        // DELETE가 안되면 POST로 시도
        if (response.status === 405) {
          response = await fetch(`/api/routes/${routeId}/delete`, {
            method: 'POST',
            credentials: 'include'
          });
        }

        const data = await response.json();
        
        if (data.error) {
          // 삭제 실패 시 원래 상태로 복원
          fetchMyRoutes();
          alert('루트 삭제 실패: ' + data.error);
        } else {
          alert('루트가 삭제되었습니다.');
          fetchProfile(); // 통계 업데이트
        }
      } catch (err) {
        // 삭제 실패 시 원래 상태로 복원
        fetchMyRoutes();
        console.error('루트 삭제 실패:', err);
        alert('루트 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '알 수 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 루트 편집 관련 함수들
  const startEditing = async (route) => {
    setEditingLoading(true);
    try {
      // 루트 상세 정보 가져오기 (관광지 목록 포함)
      const response = await fetch(`/api/routes/${route.id}`, { 
        credentials: 'include' 
      });
      const data = await response.json();
      
      if (data.error) {
        alert('루트 정보를 불러올 수 없습니다: ' + data.error);
        return;
      }
      
      setEditingRoute(route);
      setEditingSpots(data.spots || []);
      setEditingRouteName(route.name);
    } catch (err) {
      console.error('루트 상세 조회 실패:', err);
      alert('루트 정보를 불러올 수 없습니다.');
    } finally {
      setEditingLoading(false);
    }
  };

  const cancelEditing = () => {
    setEditingRoute(null);
    setEditingSpots([]);
    setEditingRouteName('');
    setAddSpotSearch('');
    setEditingLoading(false);
  };

  const saveEditing = async () => {
    if (editingRoute && editingSpots.length > 0 && editingRouteName.trim()) {
      try {
        const response = await fetch(`/api/routes/${editingRoute.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editingRouteName,
            spots: editingSpots.map(spot => spot.id)
          })
        });
        
        const data = await response.json();
        if (data.error) {
          alert('루트 수정 실패: ' + data.error);
        } else {
          // App.js의 routes 상태 즉시 업데이트
          if (onRouteUpdate) {
            const updatedRoute = {
              ...editingRoute,
              name: editingRouteName,
              spots: editingSpots
            };
            onRouteUpdate(updatedRoute);
          }
          
          // 프로필 통계 즉시 업데이트 (방문한 관광지 개수 재계산)
          setProfileUpdating(true);
          await fetchProfile();
          setProfileUpdating(false);
          
          // App.js에 프로필 업데이트 알림
          if (onProfileUpdate) {
            onProfileUpdate();
          }
          
          alert('루트가 수정되었습니다!');
          cancelEditing();
          fetchMyRoutes(); // 목록 새로고침
        }
      } catch (err) {
        console.error('루트 수정 실패:', err);
        alert('루트 수정 중 오류가 발생했습니다.');
      }
    }
  };

  const moveSpotUp = (index) => {
    if (index > 0) {
      const newSpots = [...editingSpots];
      [newSpots[index], newSpots[index - 1]] = [newSpots[index - 1], newSpots[index]];
      setEditingSpots(newSpots);
    }
  };

  const moveSpotDown = (index) => {
    if (index < editingSpots.length - 1) {
      const newSpots = [...editingSpots];
      [newSpots[index], newSpots[index + 1]] = [newSpots[index + 1], newSpots[index]];
      setEditingSpots(newSpots);
    }
  };

  const removeSpotFromEditing = (index) => {
    setEditingSpots(editingSpots.filter((_, i) => i !== index));
  };

  const addSpotToEditing = (spot) => {
    if (!editingSpots.find(s => s.id === spot.id)) {
      setEditingSpots([...editingSpots, spot]);
    }
  };



  useEffect(() => {
    const loadData = async () => {
      if (isLoggedIn) {
        setLoading(true);
        await Promise.all([fetchProfile(), fetchMyRoutes()]);
        setLoading(false);
      }
    };
    loadData();
  }, [isLoggedIn]);

  // App.js의 routes가 변경되면 myRoutes도 동기화
  useEffect(() => {
    if (routes && routes.length > 0) {
      setMyRoutes(routes);
    }
  }, [routes]);


  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error-message">{error}</div>
        <button onClick={onNavigateToHome} className="home-button">
          <img src="/icons/home-icon.png" alt="홈" style={{width: '20px', height: '20px', marginRight: '8px'}} />
          광주 관광
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* 프로필 정보 섹션 */}
      {profile && (
        <div className="section">
          <h2 className="section-title">프로필 정보</h2>
          <div className="profile-info">
            <div className="profile-card">
              <div className="profile-avatar">
                <img src="/icons/profile-icon.png" alt="프로필" className="avatar-icon" />
              </div>
              <div className="profile-details">
                <h2>{profile.username}</h2>
                <p className="email">{profile.email}</p>
                <p className="join-date">가입일: {formatDate(profile.created_at)}</p>
              </div>
            </div>

            {/* 통계 */}
            <div className="profile-stats">
              <div className="stat-item">
                <div className="stat-number">{profile.stats.total_routes}</div>
                <div className="stat-label">만든 루트</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">
                  {profileUpdating ? '...' : profile.stats.visited_spots}
                </div>
                <div className="stat-label">방문한 관광지</div>
              </div>
            </div>
            
            {/* 로그아웃 버튼 */}
            <div className="logout-section">
              <button onClick={onLogout} className="logout-button">로그아웃</button>
            </div>
          </div>
        </div>
      )}

      {/* 내가 만든 루트 섹션 */}
      <div className="section">
        <h2 className="section-title">
          <img src="/icons/stats-icon.png" alt="통계" style={{width: '28px', height: '28px', marginRight: '8px', verticalAlign: 'middle'}} />
          내가 만든 루트
        </h2>
         {myRoutes.length === 0 ? (
           <div className="no-routes">
             <p>아직 만든 루트가 없습니다.</p>
             <p>관광지를 선택해서 나만의 루트를 만들어보세요!</p>
           </div>
         ) : (
           <div className="routes-list">
             {myRoutes.map((route) => (
               <div key={route.id} className="route-item">
                 <div className="route-info">
                   <h4>{route.name}</h4>
                   <p className="route-description">{route.description}</p>
                   <div className="route-details">
                     <span>
                       {formatDate(route.created_at)} · 
                       {route.spots && route.spots.length > 0 ? calculateRouteTime(calculateRouteDistance(route.spots)) : '0분'} · 
                       {route.spots && route.spots.length > 0 ? calculateRouteDistance(route.spots).toFixed(2) : '0.00'}km
                     </span>
                     {/* 디버깅용 로그 */}
                     {console.log('ProfilePage 루트 데이터:', route)}
                   </div>
                 </div>
                                   <div className="route-actions">
                    <button 
                      onClick={() => startEditing(route)}
                      className="edit-button"
                      disabled={editingLoading}
                    >
                      {editingLoading ? '로딩...' : '편집'}
                    </button>
                    <button 
                      onClick={() => deleteRoute(route.id)}
                      className="delete-button"
                      disabled={editingLoading}
                    >
                      삭제
                    </button>
                  </div>
               </div>
             ))}
           </div>
         )}
       </div>

      {/* 루트 추천 섹션 */}
      <div className="section">
        <h2 className="section-title">
          <img src="/icons/robot-icon.png" alt="로봇" style={{width: '28px', height: '28px', marginRight: '8px', verticalAlign: 'middle'}} />
          루트 추천
        </h2>
                                                                                       <AIRecommendationComponent
               currentRoute={null}
               spots={spots}
               themes={themes}
               isLoggedIn={isLoggedIn}
               hasSavedRoutes={myRoutes && myRoutes.length > 0}
               recommendations={aiRecommendations}
               analysis={aiAnalysis}
               onRefresh={onRefreshAI}
               onAddToRoute={(spot) => {
                 // 추천된 관광지를 루트에 추가
                 if (onAddToRoute) {
                   onAddToRoute(spot);
                 }
               }}
               onNavigateToMap={onNavigateToMap}
               onSaveRoute={onSaveRoute}
             />
      </div>

        {/* 루트 편집 모달 */}
        {editingRoute && (
          <div className="edit-modal-overlay" onClick={cancelEditing}>
            <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="edit-modal-header">
                <h3>루트 편집</h3>
                <button onClick={cancelEditing} className="close-button">✕</button>
              </div>
              
              <div className="edit-modal-body">
                {/* 루트 이름 입력 */}
                <div className="edit-route-name-section">
                  <label>루트 이름</label>
                  <input
                    type="text"
                    placeholder="루트 이름을 입력하세요"
                    value={editingRouteName}
                    onChange={(e) => setEditingRouteName(e.target.value)}
                    className="edit-route-name-input"
                  />
                </div>

                {/* 편집 중인 관광지들 */}
                <div className="editing-spots-section">
                  <h4>관광지 목록 ({editingSpots.length}개)</h4>
                  <div className="editing-spots-list">
                    {editingSpots.map((spot, index) => (
                      <div key={spot.id} className="editing-spot-item">
                        <div className="editing-spot-info">
                          <span className="editing-spot-number">{index + 1}</span>
                          <span className="editing-spot-theme">{getThemeNameById(spot.theme_id)}</span>
                          <span className="editing-spot-name">{spot.name}</span>
                        </div>
                        
                        <div className="editing-spot-actions">
                          <button 
                            onClick={() => moveSpotUp(index)} 
                            disabled={index === 0}
                            className="move-button"
                            title="위로 이동"
                          >
                            ⬆️
                          </button>
                          <button 
                            onClick={() => moveSpotDown(index)} 
                            disabled={index === editingSpots.length - 1}
                            className="move-button"
                            title="아래로 이동"
                          >
                            ⬇️
                          </button>
                          <button 
                            onClick={() => removeSpotFromEditing(index)}
                            className="remove-button"
                            title="제거"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 관광지 추가 섹션 */}
                <div className="add-spot-section">
                  <h4>관광지 추가</h4>
                  <input
                    type="text"
                    placeholder="관광지 이름이나 테마로 검색..."
                    value={addSpotSearch}
                    onChange={(e) => setAddSpotSearch(e.target.value)}
                    className="add-spot-search-input"
                  />
                                     <div className="add-spot-results">
                     {spots
                       .filter(spot => !editingSpots.find(s => s.id === spot.id))
                       .filter(spot => 
                         addSpotSearch === '' || 
                         spot.name.toLowerCase().includes(addSpotSearch.toLowerCase()) ||
                         getThemeNameById(spot.theme_id).toLowerCase().includes(addSpotSearch.toLowerCase())
                       )
                       .map(spot => (
                        <button
                          key={spot.id}
                          onClick={() => addSpotToEditing(spot)}
                          className="add-spot-item"
                        >
                          <span className="add-spot-theme">{getThemeNameById(spot.theme_id)}</span>
                          <span className="add-spot-name">{spot.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
              
              <div className="edit-modal-footer">
                <button onClick={cancelEditing} className="cancel-button">
                  취소
                </button>
                <button onClick={saveEditing} className="save-button">
                  저장
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    );
  };

export default ProfilePage;
