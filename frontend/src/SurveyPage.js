import React, { useState } from 'react';


const SurveyPage = ({ onNavigateToPage }) => {
  const [responses, setResponses] = useState({
    overallSatisfaction: '',
    designRating: '',
    functionalityRating: '',
    contentRating: '',
    navigationRating: '',
    favoriteFeatures: [],
    improvements: '',
    recommendToOthers: '',
    additionalComments: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    // 로컬 스토리지에서 기존 session_id 확인
    return localStorage.getItem('survey_session_id') || null;
  });
  const [validationErrors, setValidationErrors] = useState([]);

  const validateForm = () => {
    const errors = [];
    const {
      overallSatisfaction,
      designRating,
      functionalityRating,
      contentRating,
      navigationRating,
    } = responses;

    if (!overallSatisfaction) errors.push('전체 만족도를 선택해주세요.');
    if (!designRating) errors.push('디자인 평가를 선택해주세요.');
    if (!functionalityRating) errors.push('기능성 평가를 선택해주세요.');
    if (!contentRating) errors.push('콘텐츠 품질 평가를 선택해주세요.');
    if (!navigationRating) errors.push('네비게이션 평가를 선택해주세요.');

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const isFormValid = () => {
    const {
      overallSatisfaction,
      designRating,
      functionalityRating,
      contentRating,
      navigationRating,
    } = responses;
  
    return (
      overallSatisfaction &&
      designRating &&
      functionalityRating &&
      contentRating &&
      navigationRating
    );
  };

  const handleInputChange = (field, value) => {
    setResponses(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 입력 시 해당 필드의 에러 제거
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleCheckboxChange = (feature) => {
    setResponses(prev => ({
      ...prev,
      favoriteFeatures: prev.favoriteFeatures.includes(feature)
        ? prev.favoriteFeatures.filter(f => f !== feature)
        : [...prev.favoriteFeatures, feature]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return; // validateForm에서 에러 메시지 설정됨
      }
    
    console.log('📝 설문조사 제출 시작...');
    console.log('📊 응답 데이터:', responses);
    
    try {
      const requestData = {
        userId: null, // 로그인 기능이 구현되면 현재 사용자 ID
        session_id: sessionId, // 기존 session_id 또는 새로 생성
        responses: responses
      };
      
      console.log('🚀 서버로 전송할 데이터:', requestData);
      
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('📡 서버 응답 상태:', response.status);
      
      const data = await response.json();
      console.log('📨 서버 응답 데이터:', data);
      
      if (data.success) {
        console.log('✅ 설문조사가 성공적으로 저장되었습니다!');
        console.log('📝 서버 응답:', data);
        
        // session_id 저장 (새로운 것일 수도 있음)
        if (data.session_id) {
          localStorage.setItem('survey_session_id', data.session_id);
          setSessionId(data.session_id);
        }
        
        // 업데이트인지 새 응답인지 표시
        if (data.is_update) {
          console.log('🔄 기존 응답이 업데이트되었습니다.');
        } else {
          console.log('✨ 새로운 응답이 저장되었습니다.');
        }
        
        setIsSubmitted(true);
      } else {
        console.error('❌ 설문조사 저장 실패:', data.message);
        // 저장 실패해도 사용자에게는 성공으로 표시 (로컬 스토리지 백업)
        localStorage.setItem('survey_backup', JSON.stringify(responses));
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('❌ 설문조사 제출 중 오류:', error);
      // 네트워크 오류 시에도 로컬 스토리지에 백업
      localStorage.setItem('survey_backup', JSON.stringify(responses));
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="page-container">
        <div className="content">
          <div className="section">
            <h2 className="section-title">설문조사 완료</h2>
            <div className="settings-section">
              <div className="survey-success">
                <div className="success-icon">✅</div>
                <h2>설문조사에 참여해주셔서 감사합니다!</h2>
                <p>소중한 의견은 앱 개선에 큰 도움이 됩니다.</p>
                <button 
                  className="back-to-home-btn"
                  onClick={() => onNavigateToPage('home')}
                >
                  홈으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content">
        <div className="section">
          <h2 className="section-title">앱 만족도 설문조사</h2>
          
          {/* 유효성 검사 에러 메시지 */}
          {validationErrors.length > 0 && (
            <div style={{
              background: '#FFEBEE',
              border: '1px solid #F44336',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ color: '#F44336', fontWeight: 'bold', marginBottom: '8px' }}>
                ⚠️ 다음 항목들을 선택해주세요:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#D32F2F' }}>
                {validationErrors.map((error, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* 기본 평가 섹션 */}
            <div className="settings-section">
              <h3>기본 평가</h3>
              <div className="setting-item">
                <span>1. 광주 관광 앱에 대한 전체적인 만족도는 어떠신가요?</span>
                <div className="rating-options">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <label key={rating} className="rating-option">
                      <input
                        type="radio"
                        name="overallSatisfaction"
                        value={rating}
                        checked={responses.overallSatisfaction === rating.toString()}
                        onChange={(e) => handleInputChange('overallSatisfaction', e.target.value)}
                      />
                      <span className="rating-number">{rating}</span>
                      <span className="rating-text">
                        {rating === 1 ? '매우 불만' : 
                         rating === 2 ? '불만' : 
                         rating === 3 ? '보통' : 
                         rating === 4 ? '만족' : '매우 만족'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 상세 평가 섹션 */}
            <div className="settings-section">
              <h3>상세 평가</h3>
              <div className="setting-item">
                <span>2. 앱의 디자인과 사용자 인터페이스는 어떠신가요?</span>
                <select
                  value={responses.designRating}
                  onChange={(e) => handleInputChange('designRating', e.target.value)}
                >
                  <option value="">선택해주세요</option>
                  <option value="excellent">매우 좋음</option>
                  <option value="good">좋음</option>
                  <option value="average">보통</option>
                  <option value="poor">나쁨</option>
                  <option value="very-poor">매우 나쁨</option>
                </select>
              </div>
              <div className="setting-item">
                <span>3. 앱의 기능성과 성능은 어떠신가요?</span>
                <select
                  value={responses.functionalityRating}
                  onChange={(e) => handleInputChange('functionalityRating', e.target.value)}
                >
                  <option value="">선택해주세요</option>
                  <option value="excellent">매우 좋음</option>
                  <option value="good">좋음</option>
                  <option value="average">보통</option>
                  <option value="poor">나쁨</option>
                  <option value="very-poor">매우 나쁨</option>
                </select>
              </div>
              <div className="setting-item">
                <span>4. 관광지 정보와 콘텐츠의 품질은 어떠신가요?</span>
                <select
                  value={responses.contentRating}
                  onChange={(e) => handleInputChange('contentRating', e.target.value)}
                >
                  <option value="">선택해주세요</option>
                  <option value="excellent">매우 좋음</option>
                  <option value="good">좋음</option>
                  <option value="average">보통</option>
                  <option value="poor">나쁨</option>
                  <option value="very-poor">매우 나쁨</option>
                </select>
              </div>
              <div className="setting-item">
                <span>5. 앱 내 네비게이션과 사용 편의성은 어떠신가요?</span>
                <select
                  value={responses.navigationRating}
                  onChange={(e) => handleInputChange('navigationRating', e.target.value)}
                >
                  <option value="">선택해주세요</option>
                  <option value="excellent">매우 좋음</option>
                  <option value="good">좋음</option>
                  <option value="average">보통</option>
                  <option value="poor">나쁨</option>
                  <option value="very-poor">매우 나쁨</option>
                </select>
              </div>
            </div>

            {/* 기능 선호도 섹션 */}
            <div className="settings-section">
              <h3>기능 선호도</h3>
              <div className="setting-item">
                <span>6. 가장 유용하다고 생각하는 기능은 무엇인가요? (복수 선택 가능)</span>
                <div className="checkbox-group">
                  {[
                    '관광지 정보',
                    '투어/축제 정보',
                    '지도 기능',
                    '루트 생성',
                    '루트 추천',
                    '프로필 관리'
                  ].map(feature => (
                    <label key={feature} className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={responses.favoriteFeatures.includes(feature)}
                        onChange={() => handleCheckboxChange(feature)}
                      />
                      <span>{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 의견 및 제안 섹션 */}
            <div className="settings-section">
              <h3>의견 및 제안</h3>
              <div className="setting-item">
                <span>7. 앱에서 개선이 필요한 부분이 있다면 알려주세요.</span>
                <textarea
                  value={responses.improvements}
                  onChange={(e) => handleInputChange('improvements', e.target.value)}
                  placeholder="개선하고 싶은 기능이나 문제점을 자유롭게 작성해주세요."
                  className="survey-textarea"
                  rows="3"
                />
              </div>
              <div className="setting-item">
                <span>8. 기타 의견이나 제안사항이 있으시면 자유롭게 작성해주세요.</span>
                <textarea
                  value={responses.additionalComments}
                  onChange={(e) => handleInputChange('additionalComments', e.target.value)}
                  placeholder="앱에 대한 전반적인 의견이나 새로운 기능 제안 등을 작성해주세요."
                  className="survey-textarea"
                  rows="3"
                />
              </div>
            </div>

            <div className="survey-actions">
              <button type="button" onClick={() => onNavigateToPage('home')} className="cancel-btn">
                취소
              </button>
              <button type="submit" className="submit-btn">
                설문조사 제출
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SurveyPage;
