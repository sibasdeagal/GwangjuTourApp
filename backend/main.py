# -*- coding: utf-8 -*-
from fastapi import FastAPI, Depends, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import engine, get_db
import models
import sqlalchemy
import bcrypt
from typing import Dict
import logging
import traceback

# 데이터베이스 테이블 생성
models.Base.metadata.create_all(bind=engine)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(title='광주 관광 앱 API', version='1.0.0')

# CORS 설정
app.add_middleware(CORSMiddleware, 
    allow_origins=['http://localhost:3000', 'http://172.30.1.14:3000'],  # React 개발 서버
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

# 전역 에러 핸들러
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {exc}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            "detail": str(exc) if app.debug else "Internal server error"
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP error {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

# 간단한 세션 저장소 (실제 운영에서는 Redis 등 사용)
user_sessions: Dict[str, int] = {}

@app.get('/')
async def root():
    return {'message': '광주 관광 앱 API'}

@app.get('/health')
async def health_check():
    return {'status': 'healthy'}



# 사용자 관리 API
@app.post('/api/auth/register')
async def register_user(user_data: dict, db: Session = Depends(get_db)):
    """사용자 회원가입"""
    try:
        username = user_data.get('username')
        email = user_data.get('email')
        password = user_data.get('password')
        
        if not all([username, email, password]):
            return {'error': '사용자명, 이메일, 비밀번호를 모두 입력해주세요'}
        
        # 비밀번호 해싱
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # 사용자 생성
        cursor = db.execute(sqlalchemy.text("""
            INSERT INTO users (username, email, password_hash)
            VALUES (:username, :email, :password_hash)
            RETURNING id
        """), {
            'username': username,
            'email': email,
            'password_hash': password_hash
        })
        
        user_id = cursor.fetchone()[0]
        db.commit()
        
        return {'message': '회원가입 성공', 'user_id': user_id}
        
    except Exception as e:
        db.rollback()
        if 'duplicate key' in str(e).lower():
            return {'error': '이미 존재하는 사용자명 또는 이메일입니다'}
        return {'error': f'회원가입 실패: {str(e)}'}

@app.post('/api/auth/login')
async def login_user(user_data: dict, request: Request, response: Response, db: Session = Depends(get_db)):
    """사용자 로그인"""
    try:
        email = user_data.get('email')
        password = user_data.get('password')
        
        if not all([email, password]):
            return {'error': '이메일과 비밀번호를 입력해주세요'}
        
        # 사용자 조회
        result = db.execute(sqlalchemy.text("""
            SELECT id, username, password_hash FROM users WHERE email = :email
        """), {'email': email})
        
        user = result.fetchone()
        if not user:
            return {'error': '존재하지 않는 이메일입니다'}
        
        # 비밀번호 확인
        if not bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
            return {'error': '비밀번호가 일치하지 않습니다'}
        
        # 세션 생성 (간단한 쿠키 방식)
        session_id = f"session_{user[0]}"
        user_sessions[session_id] = user[0]
        
        response.set_cookie(key="session_id", value=session_id, httponly=True)
        
        return {
            'message': '로그인 성공',
            'user_id': user[0],
            'username': user[1]
        }
        
    except Exception as e:
        return {'error': f'로그인 실패: {str(e)}'}

@app.post('/api/auth/logout')
async def logout_user(request: Request, response: Response):
    """사용자 로그아웃"""
    try:
        session_id = request.cookies.get("session_id")
        if session_id and session_id in user_sessions:
            del user_sessions[session_id]
        
        response.delete_cookie("session_id")
        return {'message': '로그아웃 성공'}
        
    except Exception as e:
        return {'error': f'로그아웃 실패: {str(e)}'}

# 현재 로그인한 사용자 ID 가져오기
def get_current_user_id(request: Request) -> int:
    session_id = request.cookies.get("session_id")
    if not session_id or session_id not in user_sessions:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    return user_sessions[session_id]

@app.get('/api/themes')
async def get_themes(db: Session = Depends(get_db)):
    try:
        result = db.execute(sqlalchemy.text('SELECT * FROM themes ORDER BY id'))
        themes = result.fetchall()
        theme_list = []
        for theme in themes:
            theme_list.append({
                'id': theme[0],
                'name': theme[1],
                'description': theme[2],
                'icon_name': theme[3],
                'color_code': theme[4]
            })
        return {'themes': theme_list}
    except Exception as e:
        return {'error': f'테마 조회 실패: {str(e)}'}

@app.get('/api/spots')
async def get_spots(db: Session = Depends(get_db)):
    try:
        result = db.execute(sqlalchemy.text('''
            SELECT s.id, s.name, s.theme_id, s.description, s.address, 
                   s.latitude, s.longitude, s.image_url, s.operating_hours, 
                   s.contact_info, t.name as theme_name 
            FROM spots s 
            JOIN themes t ON s.theme_id = t.id 
            ORDER BY s.id
        '''))
        spots = result.fetchall()
        spot_list = []
        for spot in spots:
            spot_list.append({
                'id': spot[0],
                'name': spot[1],
                'theme_id': spot[2],
                'theme_name': spot[10],
                'description': spot[3],
                'address': spot[4],
                'latitude': float(spot[5]) if spot[5] else None,
                'longitude': float(spot[6]) if spot[6] else None,
                'image_url': spot[7],  # 이 줄을 추가해야 함!
                'operating_hours': spot[8],
                'contact_info': spot[9]
            })
        return {'spots': spot_list}
    except Exception as e:
        return {'error': f'거점 조회 실패: {str(e)}'}

@app.get('/api/themes/{theme_id}/spots')
async def get_spots_by_theme(theme_id: int, db: Session = Depends(get_db)):
    try:
        result = db.execute(sqlalchemy.text('SELECT * FROM spots WHERE theme_id = :theme_id ORDER BY id'), {'theme_id': theme_id})
        spots = result.fetchall()
        spot_list = []
        for spot in spots:
            spot_list.append({
                'id': spot[0],
                'name': spot[1],
                'theme_id': spot[2],
                'description': spot[3],
                'address': spot[4],
                'latitude': float(spot[5]) if spot[5] else None,
                'longitude': float(spot[6]) if spot[6] else None,
                'image_url': spot[7],  # 이 줄을 추가해야 함!
                'operating_hours': spot[8],
                'contact_info': spot[9]
            })
        return {'theme_id': theme_id, 'spots': spot_list}
    except Exception as e:
        return {'error': f'테마별 거점 조회 실패: {str(e)}'}

# 루트 중복 체크 API
@app.post('/api/routes/check-duplicate')
async def check_route_duplicate(route_data: dict, request: Request, db: Session = Depends(get_db)):
    try:
        user_id = get_current_user_id(request)
        if not user_id:
            return {'error': '로그인이 필요합니다'}
        
        route_name = route_data.get('name')
        spots = route_data.get('spots', [])
        
        # 동일한 이름의 루트가 있는지 확인
        name_result = db.execute(sqlalchemy.text("""
            SELECT id FROM user_routes 
            WHERE user_id = :user_id AND name = :name
        """), {'user_id': user_id, 'name': route_name})
        
        if name_result.fetchone():
            return {'is_duplicate': True, 'reason': '동일한 이름의 루트가 이미 존재합니다'}
        
        # 동일한 관광지 조합의 루트가 있는지 확인
        if len(spots) > 0:
            # 사용자의 모든 루트에서 관광지 조합 확인 (SQLite 문법)
            routes_result = db.execute(sqlalchemy.text("""
                SELECT r.id, r.name, GROUP_CONCAT(CAST(rs.spot_id AS TEXT), ',') as spot_combination
                FROM user_routes r
                JOIN route_spots rs ON r.id = rs.route_id
                WHERE r.user_id = :user_id
                GROUP BY r.id, r.name
            """), {'user_id': user_id})
            
            existing_routes = routes_result.fetchall()
            new_spot_combination = ','.join(sorted([str(spot_id) for spot_id in spots]))
            
            for route in existing_routes:
                if route[2] == new_spot_combination:
                    return {'is_duplicate': True, 'reason': '동일한 관광지 조합의 루트가 이미 존재합니다'}
        
        return {'is_duplicate': False}
        
    except Exception as e:
        return {'error': f'중복 체크 실패: {str(e)}'}

# 루트 생성 API (사용자 연결)
@app.post('/api/routes')
async def create_route(route_data: dict, request: Request, db: Session = Depends(get_db)):
    try:
        # 현재 로그인한 사용자 ID 가져오기
        user_id = get_current_user_id(request)
        
        # 루트 기본 정보 저장 (사용자 ID 포함)
        cursor = db.execute(sqlalchemy.text("""
            INSERT INTO user_routes (name, description, estimated_time, total_distance, user_id)
            VALUES (:name, :description, :estimated_time, :total_distance, :user_id)
            RETURNING id
        """), {
            'name': route_data.get('name'),
            'description': route_data.get('description'),
            'estimated_time': route_data.get('estimated_time'),
            'total_distance': route_data.get('total_distance'),
            'user_id': user_id
        })
        
        route_id = cursor.fetchone()[0]
        
        # 루트에 포함된 거점들 저장
        spots = route_data.get('spots', [])
        for i, spot_id in enumerate(spots):
            db.execute(sqlalchemy.text("""
                INSERT INTO route_spots (route_id, spot_id, spot_order)
                VALUES (:route_id, :spot_id, :order)
            """), {
                'route_id': route_id,
                'spot_id': spot_id,
                'order': i + 1
            })
        
        db.commit()
        return {'message': '루트 생성 성공', 'route_id': route_id}
        
    except Exception as e:
        db.rollback()
        return {'error': f'루트 생성 실패: {str(e)}'}

# 루트 목록 조회 API (내 루트만)
@app.get('/api/routes')
async def get_routes(request: Request, db: Session = Depends(get_db)):
    try:
        # 현재 로그인한 사용자 ID 가져오기
        user_id = get_current_user_id(request)
        
        result = db.execute(sqlalchemy.text("""
            SELECT r.id, r.name, r.description, r.estimated_time, r.total_distance, r.created_at, COUNT(rs.spot_id) as spot_count
            FROM user_routes r
            LEFT JOIN route_spots rs ON r.id = rs.route_id
            WHERE r.user_id = :user_id
            GROUP BY r.id, r.name, r.description, r.estimated_time, r.total_distance, r.created_at
            ORDER BY r.created_at DESC
            """), {'user_id': user_id})
        
        routes = result.fetchall()
        route_list = []
        for route in routes:
            route_list.append({
                'id': route[0],
                'name': route[1],
                'description': route[2],
                'estimated_time': route[3],
                'total_distance': float(route[4]) if route[4] else None,
                'created_at': route[5],
                'spot_count': route[6]
            })
        return {'routes': route_list}
        
    except Exception as e:
        return {'error': f'루트 조회 실패: {str(e)}'}

# 루트 상세 조회 API (내 루트만)
@app.get('/api/routes/{route_id}')
async def get_route_detail(route_id: int, request: Request, db: Session = Depends(get_db)):
    try:
        # 현재 로그인한 사용자 ID 가져오기
        user_id = get_current_user_id(request)
        
        # 루트 기본 정보 (내 루트인지 확인)
        route_result = db.execute(sqlalchemy.text("""
            SELECT id, name, description, estimated_time, total_distance, created_at 
            FROM user_routes WHERE id = :route_id AND user_id = :user_id
        """), {'route_id': route_id, 'user_id': user_id})
        
        route = route_result.fetchone()
        if not route:
            raise HTTPException(status_code=404, detail="루트를 찾을 수 없습니다")
        
        # 루트에 포함된 거점들
        spots_result = db.execute(sqlalchemy.text("""
            SELECT s.*, rs.spot_order
            FROM route_spots rs
            JOIN spots s ON rs.spot_id = s.id
            WHERE rs.route_id = :route_id
            ORDER BY rs.spot_order
        """), {'route_id': route_id})
        
        spots = spots_result.fetchall()
        spot_list = []
        for spot in spots:
            spot_list.append({
                'id': spot[0],
                'name': spot[1],
                'theme_id': spot[2],
                'description': spot[3],
                'address': spot[4],
                'latitude': float(spot[5]) if spot[5] else None,
                'longitude': float(spot[6]) if spot[6] else None,
                'image_url': spot[7],
                'operating_hours': spot[8],
                'contact_info': spot[9],
                'spot_order': spot[10]
            })
        
        return {
            'route': {
                'id': route[0],
                'name': route[1],
                'description': route[2],
                'estimated_time': route[3],
                'total_distance': float(route[4]) if route[4] else None,
                'created_at': route[5]
            },
            'spots': spot_list
        }
        
    except Exception as e:
        return {'error': f'루트 상세 조회 실패: {str(e)}'}

# 루트 삭제 API (DELETE 메서드)
@app.delete('/api/routes/{route_id}')
async def delete_route(route_id: int, request: Request, db: Session = Depends(get_db)):
    """루트 삭제"""
    try:
        # 현재 로그인한 사용자 ID 가져오기
        user_id = get_current_user_id(request)
        
        # 루트가 내 루트인지 확인
        route_result = db.execute(sqlalchemy.text("""
            SELECT id FROM user_routes WHERE id = :route_id AND user_id = :user_id
        """), {'route_id': route_id, 'user_id': user_id})
        
        if not route_result.fetchone():
            raise HTTPException(status_code=404, detail="루트를 찾을 수 없습니다")
        
        # 루트 삭제 (CASCADE로 route_spots도 자동 삭제됨)
        db.execute(sqlalchemy.text("""
            DELETE FROM user_routes WHERE id = :route_id AND user_id = :user_id
        """), {'route_id': route_id, 'user_id': user_id})
        
        db.commit()
        return {'message': '루트 삭제 성공'}
        
    except Exception as e:
        db.rollback()
        return {'error': f'루트 삭제 실패: {str(e)}'}

# 루트 삭제 API (POST 메서드 - 대체용)
@app.post('/api/routes/{route_id}/delete')
async def delete_route_post(route_id: int, request: Request, db: Session = Depends(get_db)):
    """루트 삭제 (POST 메서드)"""
    try:
        # 현재 로그인한 사용자 ID 가져오기
        user_id = get_current_user_id(request)
        
        # 루트가 내 루트인지 확인
        route_result = db.execute(sqlalchemy.text("""
            SELECT id FROM user_routes WHERE id = :route_id AND user_id = :user_id
        """), {'route_id': route_id, 'user_id': user_id})
        
        if not route_result.fetchone():
            raise HTTPException(status_code=404, detail="루트를 찾을 수 없습니다")
        
        # 루트 삭제 (CASCADE로 route_spots도 자동 삭제됨)
        db.execute(sqlalchemy.text("""
            DELETE FROM user_routes WHERE id = :route_id AND user_id = :user_id
        """), {'route_id': route_id, 'user_id': user_id})
        
        db.commit()
        return {'message': '루트 삭제 성공'}
        
    except Exception as e:
        db.rollback()
        return {'error': f'루트 삭제 실패: {str(e)}'}

# 루트 추천 API들 (사용자별 개인화)
@app.get('/api/recommendations/theme/{theme_id}')
async def get_theme_based_recommendations(theme_id: int, request: Request, db: Session = Depends(get_db)):
    """테마 기반 루트 추천 (내 루트 기반)"""
    try:
        # 현재 로그인한 사용자 ID 가져오기
        user_id = get_current_user_id(request)
        
        # 해당 테마의 거점들을 포함하는 내 루트들 찾기
        result = db.execute(sqlalchemy.text("""
            SELECT DISTINCT r.*, COUNT(rs.spot_id) as spot_count
            FROM user_routes r
            JOIN route_spots rs ON r.id = rs.route_id
            JOIN spots s ON rs.spot_id = s.id
            WHERE s.theme_id = :theme_id AND r.user_id = :user_id
            GROUP BY r.id
            ORDER BY r.created_at DESC
        """), {'theme_id': theme_id, 'user_id': user_id})
        
        routes = result.fetchall()
        route_list = []
        for route in routes:
            route_list.append({
                'id': route[0],
                'name': route[1],
                'description': route[2],
                'estimated_time': route[3],
                'total_distance': float(route[4]) if route[4] else None,
                'created_at': route[5],
                'spot_count': route[7]
            })
        
        # 테마 이름 가져오기
        theme_result = db.execute(sqlalchemy.text("SELECT name FROM themes WHERE id = :theme_id"), {'theme_id': theme_id})
        theme_row = theme_result.fetchone()
        theme_name = theme_row[0] if theme_row else "Unknown"
        
        return {
            "theme_id": theme_id,
            "theme_name": theme_name,
            "recommended_routes": route_list,
            "total_count": len(route_list)
        }
    except Exception as e:
        return {'error': f'테마 기반 추천 실패: {str(e)}'}

@app.get('/api/recommendations/spot/{spot_id}')
async def get_spot_based_recommendations(spot_id: int, request: Request, db: Session = Depends(get_db)):
    """특정 거점을 포함하는 루트 추천 (내 루트 기반)"""
    try:
        # 현재 로그인한 사용자 ID 가져오기
        user_id = get_current_user_id(request)
        
        # 해당 거점을 포함하는 내 루트들 찾기
        result = db.execute(sqlalchemy.text("""
            SELECT r.*, COUNT(rs.spot_id) as spot_count
            FROM user_routes r
            JOIN route_spots rs ON r.id = rs.route_id
            WHERE rs.spot_id = :spot_id AND r.user_id = :user_id
            GROUP BY r.id
            RETURNING id
        """), {'spot_id': spot_id, 'user_id': user_id})
        
        routes = result.fetchall()
        route_list = []
        for route in routes:
            route_list.append({
                'id': route[0],
                'name': route[1],
                'description': route[2],
                'estimated_time': route[3],
                'total_distance': float(route[4]) if route[4] else None,
                'created_at': route[5],
                'spot_count': route[7]
            })
        
        # 거점 이름 가져오기
        spot_result = db.execute(sqlalchemy.text("SELECT name FROM spots WHERE id = :spot_id"), {'spot_id': spot_id})
        spot_row = spot_result.fetchone()
        spot_name = spot_row[0] if spot_row else "Unknown"
        
        return {
            "spot_id": spot_id,
            "spot_name": spot_name,
            "recommended_routes": route_list,
            "total_count": len(route_list)
        }
    except Exception as e:
        return {'error': f'거점 기반 추천 실패: {str(e)}'}

@app.get('/api/recommendations/similar/{route_id}')
async def get_similar_routes(route_id: int, request: Request, db: Session = Depends(get_db)):
    """유사한 루트 추천 (내 루트들 중에서)"""
    try:
        # 현재 로그인한 사용자 ID 가져오기
        user_id = get_current_user_id(request)
        
        # 현재 루트 정보 가져오기 (내 루트인지 확인)
        route_result = db.execute(sqlalchemy.text("SELECT * FROM user_routes WHERE id = :route_id AND user_id = :user_id"), {'route_id': route_id, 'user_id': user_id})
        current_route = route_result.fetchone()
        if not current_route:
            raise HTTPException(status_code=404, detail="루트를 찾을 수 없습니다")
        
        # 현재 루트의 거점들
        spots_result = db.execute(sqlalchemy.text("SELECT spot_id FROM route_spots WHERE route_id = :route_id"), {'route_id': route_id})
        current_spot_ids = [spot[0] for spot in spots_result.fetchall()]
        
        if not current_spot_ids:
            return {
                "current_route_id": route_id,
                "current_route_name": current_route[1],
                "similar_routes": [],
                "total_count": 0
            }
        
        # 유사한 루트들 찾기 (내 루트들 중에서 공통 거점이 있는 루트들)
        placeholders = ','.join([':spot' + str(i) for i in range(len(current_spot_ids))])
        params = {f'spot{i}': spot_id for i, spot_id in enumerate(current_spot_ids)}
        params['route_id'] = route_id
        params['user_id'] = user_id
        
        result = db.execute(sqlalchemy.text(f"""
            SELECT DISTINCT r.*, COUNT(rs.spot_id) as spot_count,
                   COUNT(CASE WHEN rs.spot_id IN ({placeholders}) THEN 1 END) as common_spots
            FROM user_routes r
            JOIN route_spots rs ON r.id = rs.route_id
            WHERE r.id != :route_id AND r.user_id = :user_id
            GROUP BY r.id
            HAVING COUNT(CASE WHEN rs.spot_id IN ({placeholders}) THEN 1 END) > 0
            ORDER BY common_spots DESC, r.created_at DESC
        """), params)
        
        routes = result.fetchall()
        route_list = []
        for route in routes:
            route_list.append({
                'id': route[0],
                'name': route[1],
                'description': route[2],
                'estimated_time': route[3],
                'total_distance': float(route[4]) if route[4] else None,
                'created_at': route[5],
                'common_spots': route[8]
            })
        
        return {
            "current_route_id": route_id,
            "current_route_name": current_route[1],
            "similar_routes": route_list,
            "total_count": len(route_list)
        }
        
    except Exception as e:
        return {'error': f'유사 루트 추천 실패: {str(e)}'}

# 루트 추천 시스템 API들
@app.get('/api/ai/recommendations/spots')
async def get_ai_spot_recommendations(
    base_spot_id: int = None,
    user_id: int = None,
    limit: int = 5,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """기반 관광지 추천 (임시 간단 버전)"""
    try:
        # 간단한 추천: 인기 관광지 반환
        result = db.execute(sqlalchemy.text("""
            SELECT id, name, theme_id, latitude, longitude, description
            FROM spots 
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            ORDER BY id
            LIMIT :limit
        """), {'limit': limit})
        
        spots = result.fetchall()
        recommendations = []
        for spot in spots:
            recommendations.append({
                'id': spot[0],
                'name': spot[1],
                'theme_id': spot[2],
                'latitude': float(spot[3]) if spot[3] else None,
                'longitude': float(spot[4]) if spot[4] else None,
                'description': spot[5],
                'ai_score': 85.0,  # 고정 점수
                'collaborative_score': 0,
                'content_score': 85
            })
        
        return {
            "user_id": user_id or 1,
            "recommendations": recommendations,
            "algorithm": "simple_popular",
            "total_count": len(recommendations)
        }
        
    except Exception as e:
        return {'error': f'추천 실패: {str(e)}'}

@app.get('/api/ai/recommendations/routes')
async def get_ai_route_recommendations(
    limit: int = 5,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """기반 루트 추천 - 사용자 패턴 분석 기반"""
    try:
        user_id = get_current_user_id(request)
        if not user_id:
            return {'error': '로그인이 필요합니다'}
        
        # 사용자의 루트 목록 가져오기 (최신순)
        routes_result = db.execute(sqlalchemy.text("""
            SELECT id, name, created_at FROM user_routes 
            WHERE user_id = :user_id 
            ORDER BY created_at DESC
        """), {'user_id': user_id})
        user_routes = routes_result.fetchall()
        
        if not user_routes:
            return {'error': '저장된 루트가 없습니다. 먼저 루트를 만들어주세요.'}
        
        # 가장 최근 루트 분석
        latest_route_id = user_routes[0][0]
        latest_route_name = user_routes[0][1]
        
        # 최근 루트의 관광지들 가져오기
        spots_result = db.execute(sqlalchemy.text("""
            SELECT s.id, s.name, s.theme_id, s.latitude, s.longitude
            FROM route_spots rs
            JOIN spots s ON rs.spot_id = s.id
            WHERE rs.route_id = :route_id
            ORDER BY rs.id
        """), {'route_id': latest_route_id})
        latest_route_spots = spots_result.fetchall()
        
        if not latest_route_spots:
            return {'error': '루트에 관광지가 없습니다.'}
        
        # 테마 분석
        theme_counts = {}
        for spot in latest_route_spots:
            theme_id = spot[2]
            theme_counts[theme_id] = theme_counts.get(theme_id, 0) + 1
        
        # 관광지 개수
        spot_count = len(latest_route_spots)
        
        # 루트 추천 생성
        recommended_routes = []
        
        # 테마별로 필요한 관광지들을 수집
        theme_spots = {}
        for spot in latest_route_spots:
            theme_id = spot[2]
            if theme_id not in theme_spots:
                theme_spots[theme_id] = []
            
            # 해당 테마의 다른 관광지들 가져오기
            other_spots_result = db.execute(sqlalchemy.text("""
                SELECT s.id, s.name, s.theme_id, s.latitude, s.longitude
                FROM spots s
                WHERE s.theme_id = :theme_id 
                AND s.id NOT IN (
                    SELECT rs.spot_id FROM route_spots rs WHERE rs.route_id = :route_id
                )
                ORDER BY RANDOM()
                LIMIT 3
            """), {
                'theme_id': theme_id, 
                'route_id': latest_route_id
            })
            other_spots = other_spots_result.fetchall()
            
            if other_spots:
                theme_spots[theme_id].extend([{
                    'id': spot_data[0],
                    'name': spot_data[1],
                    'theme_id': spot_data[2],
                    'latitude': float(spot_data[3]) if spot_data[3] else 0,
                    'longitude': float(spot_data[4]) if spot_data[4] else 0
                } for spot_data in other_spots])
            else:
                # 다른 관광지가 없으면 같은 테마의 다른 관광지 선택
                fallback_spots_result = db.execute(sqlalchemy.text("""
                    SELECT s.id, s.name, s.theme_id, s.latitude, s.longitude
                    FROM spots s
                    WHERE s.theme_id = :theme_id 
                    ORDER BY RANDOM()
                    LIMIT 3
                """), {
                    'theme_id': theme_id
                })
                fallback_spots = fallback_spots_result.fetchall()
                
                if fallback_spots:
                    theme_spots[theme_id].extend([{
                        'id': spot_data[0],
                        'name': spot_data[1],
                        'theme_id': spot_data[2],
                        'latitude': float(spot_data[3]) if spot_data[3] else 0,
                        'longitude': float(spot_data[4]) if spot_data[4] else 0
                    } for spot_data in fallback_spots])
        
        # 각 추천 루트 생성 (테마 순서 랜덤)
        for i in range(min(limit, 3)):  # 최대 3개 추천
            recommended_spots = []
            
            # 테마별로 필요한 개수만큼 관광지 선택 (순서 랜덤)
            import random
            
            # 원본 루트의 테마 순서를 랜덤하게 섞기
            theme_order = list(theme_counts.keys())
            random.shuffle(theme_order)
            
            # 각 테마별로 필요한 개수만큼 관광지 선택
            for theme_id in theme_order:
                count = theme_counts[theme_id]
                available_spots = theme_spots.get(theme_id, [])
                
                # 필요한 개수만큼 선택
                for _ in range(count):
                    if available_spots:
                        # 랜덤하게 선택
                        selected_spot = random.choice(available_spots)
                        recommended_spots.append(selected_spot)
                        # 중복 방지를 위해 선택된 관광지 제거
                        available_spots.remove(selected_spot)
            
            # 추천 루트가 비어있지 않으면 추가
            if recommended_spots:
                # 루트 이름 생성 (관광지 이름 기반)
                spot_names = [spot['name'] for spot in recommended_spots]
                if len(spot_names) <= 3:
                    # 3개 이하면 모든 관광지 이름 표시
                    route_name = f"{' → '.join(spot_names)} 루트"
                else:
                    # 3개 초과면 첫 번째와 마지막 관광지 + 개수 표시
                    route_name = f"{spot_names[0]} → ... → {spot_names[-1]} 루트 ({len(spot_names)}개)"
                
                # 거리와 시간 계산 (간단한 추정)
                total_distance = len(recommended_spots) * 1.5  # 관광지당 1.5km 추정
                estimated_time = len(recommended_spots) * 1.5  # 관광지당 1.5시간 추정
                
                recommended_routes.append({
                    'id': f"recommended_{i+1}",
                    'name': route_name,
                    'spots': recommended_spots,
                    'total_distance': round(total_distance, 1),
                    'estimated_time': round(estimated_time, 1),
                    'recommended': True,
                    'score': 85 + (i * 5),  # 첫 번째 추천이 가장 높은 점수
                    'based_on_route': latest_route_name
                })
        
        return {
            "user_id": user_id,
            "recommended_routes": recommended_routes,
            "algorithm": "pattern_based",
            "total_count": len(recommended_routes),
            "analysis": {
                "based_on_route": latest_route_name,
                "theme_pattern": theme_counts,
                "spot_count": spot_count
            }
        }
        
    except Exception as e:
        logger.error(f"루트 추천 실패: {e}")
        return {'error': f'루트 추천 실패: {str(e)}'}

@app.post('/api/ai/feedback')
async def submit_ai_feedback(
    feedback_data: dict,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """추천 피드백 수집 (학습 데이터)"""
    try:
        user_id = get_current_user_id(request)
        
        if not user_id:
            # 테스트용으로 임시 사용자 ID 사용
            user_id = 1  # 임시 사용자 ID
            print("테스트 모드: 임시 사용자 ID 1 사용")
        
        # 피드백 데이터 저장
        save_user_feedback(user_id, feedback_data, db)
        
        # 실시간 모델 업데이트 (간단한 버전)
        update_recommendation_model(user_id, feedback_data, db)
        
        return {"message": "피드백이 성공적으로 저장되었습니다"}
        
    except Exception as e:
        return {'error': f'피드백 저장 실패: {str(e)}'}

# 루트 추천 시스템 헬퍼 함수들
def collect_user_behavior(user_id: int, db: Session):
    """사용자 행동 데이터 수집"""
    try:
        # 사용자의 루트 생성 패턴 (SQLite 문법)
        route_patterns = db.execute(sqlalchemy.text("""
            SELECT 
                r.id, r.name, r.created_at,
                COUNT(rs.spot_id) as spot_count,
                AVG(s.theme_id) as avg_theme_id,
                GROUP_CONCAT(DISTINCT CAST(s.theme_id AS TEXT), ',') as theme_sequence
            FROM user_routes r
            JOIN route_spots rs ON r.id = rs.route_id
            JOIN spots s ON rs.spot_id = s.id
            WHERE r.user_id = :user_id
            GROUP BY r.id, r.name, r.created_at
            ORDER BY r.created_at DESC
        """), {'user_id': user_id}).fetchall()
        
        # 사용자의 관광지 방문 패턴
        spot_preferences = db.execute(sqlalchemy.text("""
            SELECT 
                s.theme_id,
                COUNT(*) as visit_count,
                AVG(rs.spot_order) as avg_position
            FROM route_spots rs
            JOIN spots s ON rs.spot_id = s.id
            JOIN user_routes r ON rs.route_id = r.id
            WHERE r.user_id = :user_id
            GROUP BY s.theme_id
            ORDER BY visit_count DESC
        """), {'user_id': user_id}).fetchall()
        
        # 시간대별 패턴 (SQLite 문법)
        time_patterns = db.execute(sqlalchemy.text("""
            SELECT 
                CAST(strftime('%H', r.created_at) AS INTEGER) as hour,
                COUNT(*) as route_count
            FROM user_routes r
            WHERE r.user_id = :user_id
            GROUP BY hour
            ORDER BY route_count DESC
        """), {'user_id': user_id}).fetchall()
        
        return {
            'route_patterns': [dict(zip(['id', 'name', 'created_at', 'spot_count', 'avg_theme_id', 'theme_sequence'], row)) for row in route_patterns],
            'spot_preferences': [dict(zip(['theme_id', 'visit_count', 'avg_position'], row)) for row in spot_preferences],
            'time_patterns': [dict(zip(['hour', 'route_count'], row)) for row in time_patterns]
        }
        
    except Exception as e:
        print(f"사용자 행동 데이터 수집 실패: {e}")
        return {}

def find_similar_users(user_id: int, user_behavior: dict, db: Session):
    """협업 필터링: 비슷한 사용자 찾기"""
    try:
        # 현재 사용자의 테마 선호도
        current_user_themes = {pref['theme_id']: pref['visit_count'] for pref in user_behavior.get('spot_preferences', [])}
        
        # 다른 사용자들의 테마 선호도와 비교
        all_users = db.execute(sqlalchemy.text("""
            SELECT DISTINCT r.user_id
            FROM user_routes r
            WHERE r.user_id != :user_id
        """), {'user_id': user_id}).fetchall()
        
        similar_users = []
        for other_user in all_users:
            other_user_id = other_user[0]
            
            # 다른 사용자의 테마 선호도
            other_user_themes = db.execute(sqlalchemy.text("""
                SELECT 
                    s.theme_id,
                    COUNT(*) as visit_count
                FROM route_spots rs
                JOIN spots s ON rs.spot_id = s.id
                JOIN user_routes r ON rs.route_id = r.id
                WHERE r.user_id = :user_id
                GROUP BY s.theme_id
            """), {'user_id': other_user_id}).fetchall()
            
            other_user_themes_dict = {row[0]: row[1] for row in other_user_themes}
            
            # 코사인 유사도 계산
            similarity = calculate_cosine_similarity(current_user_themes, other_user_themes_dict)
            
            if similarity > 0.3:  # 유사도 임계값
                similar_users.append({
                    'user_id': other_user_id,
                    'similarity': similarity,
                    'themes': other_user_themes_dict
                })
        
        # 유사도 순으로 정렬
        similar_users.sort(key=lambda x: x['similarity'], reverse=True)
        return similar_users[:10]  # 상위 10명
        
    except Exception as e:
        print(f"유사 사용자 찾기 실패: {e}")
        return []

def calculate_cosine_similarity(user1_themes: dict, user2_themes: dict):
    """코사인 유사도 계산"""
    try:
        # 모든 테마 ID 수집
        all_themes = set(user1_themes.keys()) | set(user2_themes.keys())
        
        if not all_themes:
            return 0.0
        
        # 벡터 생성
        vector1 = [user1_themes.get(theme_id, 0) for theme_id in all_themes]
        vector2 = [user2_themes.get(theme_id, 0) for theme_id in all_themes]
        
        # 코사인 유사도 계산
        dot_product = sum(a * b for a, b in zip(vector1, vector2))
        magnitude1 = sum(a * a for a in vector1) ** 0.5
        magnitude2 = sum(b * b for b in vector2) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
        
    except Exception as e:
        print(f"코사인 유사도 계산 실패: {e}")
        return 0.0

def content_based_recommendations(user_id: int, base_spot_id: int = None, db: Session = None):
    """콘텐츠 기반 추천 (관광지 특성 기반)"""
    try:
        # 사용자의 선호 테마
        user_themes = db.execute(sqlalchemy.text("""
            SELECT 
                s.theme_id,
                COUNT(*) as preference_score
            FROM route_spots rs
            JOIN spots s ON rs.spot_id = s.id
            JOIN user_routes r ON rs.route_id = r.id
            WHERE r.user_id = :user_id
            GROUP BY s.theme_id
            ORDER BY preference_score DESC
        """), {'user_id': user_id}).fetchall()
        
        preferred_themes = [row[0] for row in user_themes[:3]]  # 상위 3개 테마
        
        # 기준 관광지 정보
        base_spot = None
        if base_spot_id:
            base_spot = db.execute(sqlalchemy.text("""
                SELECT id, name, theme_id, latitude, longitude
                FROM spots WHERE id = :spot_id
            """), {'spot_id': base_spot_id}).fetchone()
        
        # 콘텐츠 기반 추천 계산
        if base_spot:
            # 기준 관광지와 유사한 관광지들
            similar_spots = db.execute(sqlalchemy.text("""
                SELECT 
                    s.*,
                    CASE 
                        WHEN s.theme_id = :base_theme_id THEN 100
                        WHEN s.theme_id = ANY(:preferred_themes) THEN 80
                        ELSE 50
                    END as content_score
                FROM spots s
                WHERE s.id != :base_spot_id
                AND s.latitude IS NOT NULL 
                AND s.longitude IS NOT NULL
                ORDER BY content_score DESC, s.id
                LIMIT 20
            """), {
                'base_spot_id': base_spot_id,
                'base_theme_id': base_spot[2],
                'preferred_themes': preferred_themes
            }).fetchall()
        else:
            # 선호 테마 기반 추천
            similar_spots = db.execute(sqlalchemy.text("""
                SELECT 
                    s.*,
                    CASE 
                        WHEN s.theme_id = ANY(:preferred_themes) THEN 100
                        ELSE 50
                    END as content_score
                FROM spots s
                WHERE s.latitude IS NOT NULL 
                AND s.longitude IS NOT NULL
                ORDER BY content_score DESC, s.id
                LIMIT 20
            """), {'preferred_themes': preferred_themes}).fetchall()
        
        return [dict(zip(['id', 'name', 'theme_id', 'latitude', 'longitude', 'content_score'], row)) for row in similar_spots]
        
    except Exception as e:
        print(f"콘텐츠 기반 추천 실패: {e}")
        return []

def hybrid_recommendation_algorithm(similar_users: list, content_recs: list, user_behavior: dict, limit: int, db: Session = None):
    """하이브리드 추천 알고리즘"""
    try:
        # 협업 필터링 점수 계산
        collaborative_scores = {}
        for similar_user in similar_users:
            try:
                # 유사 사용자가 방문한 관광지들
                visited_spots = db.execute(sqlalchemy.text("""
                    SELECT DISTINCT rs.spot_id
                    FROM route_spots rs
                    JOIN user_routes r ON rs.route_id = r.id
                    WHERE r.user_id = :user_id
                """), {'user_id': similar_user['user_id']}).fetchall()
                
                for spot_row in visited_spots:
                    spot_id = spot_row[0]
                    if spot_id not in collaborative_scores:
                        collaborative_scores[spot_id] = 0
                    collaborative_scores[spot_id] += similar_user['similarity'] * 10
            except Exception as e:
                print(f"협업 필터링 점수 계산 실패: {e}")
                continue
        
        # 콘텐츠 기반 점수
        content_scores = {spot['id']: spot['content_score'] for spot in content_recs}
        
        # 하이브리드 점수 계산 (협업 60% + 콘텐츠 40%)
        hybrid_scores = {}
        all_spot_ids = set(collaborative_scores.keys()) | set(content_scores.keys())
        
        for spot_id in all_spot_ids:
            collab_score = collaborative_scores.get(spot_id, 0)
            content_score = content_scores.get(spot_id, 0)
            
            # 정규화
            max_collab = max(collaborative_scores.values()) if collaborative_scores else 1
            max_content = max(content_scores.values()) if content_scores else 1
            
            normalized_collab = collab_score / max_collab if max_collab > 0 else 0
            normalized_content = content_score / max_content if max_content > 0 else 0
            
            hybrid_scores[spot_id] = normalized_collab * 0.6 + normalized_content * 0.4
        
        # 상위 추천 결과 반환
        sorted_spots = sorted(hybrid_scores.items(), key=lambda x: x[1], reverse=True)
        
        # 관광지 상세 정보 가져오기
        recommended_spots = []
        for spot_id, score in sorted_spots[:limit]:
            try:
                spot_info = db.execute(sqlalchemy.text("""
                    SELECT id, name, theme_id, latitude, longitude, description
                    FROM spots WHERE id = :spot_id
                """), {'spot_id': spot_id}).fetchone()
                
                if spot_info:
                    recommended_spots.append({
                        'id': spot_info[0],
                        'name': spot_info[1],
                        'theme_id': spot_info[2],
                        'latitude': spot_info[3],
                        'longitude': spot_info[4],
                        'description': spot_info[5],
                        'ai_score': score * 100,  # 백분율로 변환
                        'collaborative_score': collaborative_scores.get(spot_id, 0),
                        'content_score': content_scores.get(spot_id, 0)
                    })
            except Exception as e:
                print(f"관광지 {spot_id} 정보 조회 실패: {e}")
                continue
        
        return recommended_spots
        
    except Exception as e:
        print(f"하이브리드 추천 실패: {e}")
        return []

def analyze_user_route_patterns(user_id: int, db: Session):
    """사용자 루트 패턴 분석"""
    try:
        # 루트 길이 패턴
        try:
            route_length_patterns = db.execute(sqlalchemy.text("""
                SELECT 
                    route_length,
                    COUNT(*) as frequency
                FROM (
                    SELECT r.id, COUNT(rs.spot_id) as route_length
                    FROM user_routes r
                    JOIN route_spots rs ON r.id = rs.route_id
                    WHERE r.user_id = :user_id
                    GROUP BY r.id
                ) subquery
                GROUP BY route_length
                ORDER BY frequency DESC
            """), {'user_id': user_id}).fetchall()
        except Exception as e:
            print(f"루트 길이 패턴 분석 실패: {e}")
            route_length_patterns = []
        
        # 테마 조합 패턴
        try:
            theme_combination_patterns = db.execute(sqlalchemy.text("""
                SELECT 
                    theme_combination,
                    COUNT(*) as frequency
                FROM (
                    SELECT r.id, GROUP_CONCAT(DISTINCT CAST(s.theme_id AS TEXT), ',') as theme_combination
                    FROM user_routes r
                    JOIN route_spots rs ON r.id = rs.route_id
                    JOIN spots s ON rs.spot_id = s.id
                    WHERE r.user_id = :user_id
                    GROUP BY r.id
                ) subquery
                GROUP BY theme_combination
                ORDER BY frequency DESC
            """), {'user_id': user_id}).fetchall()
        except Exception as e:
            print(f"테마 조합 패턴 분석 실패: {e}")
            theme_combination_patterns = []
        
        return {
            'route_lengths': [dict(zip(['length', 'frequency'], row)) for row in route_length_patterns],
            'theme_combinations': [dict(zip(['combination', 'frequency'], row)) for row in theme_combination_patterns]
        }
        
    except Exception as e:
        print(f"루트 패턴 분석 실패: {e}")
        return {}

def generate_recommended_routes(user_patterns: dict, limit: int, db: Session):
    """추천 루트 생성"""
    try:
        ai_routes = []
        
        # 패턴 기반 루트 생성
        for i in range(limit):
            try:
                # 선호하는 루트 길이 선택
                preferred_length = 3  # 기본값
                if user_patterns.get('route_lengths') and len(user_patterns['route_lengths']) > 0:
                    preferred_length = user_patterns['route_lengths'][0]['length']
                
                # 선호하는 테마 조합 선택
                preferred_themes = [1, 2, 3]  # 기본값
                if user_patterns.get('theme_combinations') and len(user_patterns['theme_combinations']) > 0:
                    theme_combo = user_patterns['theme_combinations'][0]['combination']
                    try:
                        preferred_themes = [int(t) for t in theme_combo.split(',')]
                    except:
                        preferred_themes = [1, 2, 3]  # 파싱 실패 시 기본값
                
                # 추천 루트 생성
                recommended_route = generate_single_recommended_route(preferred_length, preferred_themes, db)
                if recommended_route:
                    ai_routes.append(recommended_route)
            except Exception as e:
                print(f"추천 루트 {i+1} 생성 실패: {e}")
                continue
        
        return ai_routes
        
    except Exception as e:
        print(f"추천 루트 생성 실패: {e}")
        return []

def generate_single_recommended_route(length: int, preferred_themes: list, db: Session):
    """단일 추천 루트 생성"""
    try:
        # 선호 테마의 관광지들 선택
        selected_spots = []
        for theme_id in preferred_themes[:length]:
            try:
                spots = db.execute(sqlalchemy.text("""
                    SELECT id, name, theme_id, latitude, longitude
                    FROM spots 
                    WHERE theme_id = :theme_id
                    AND latitude IS NOT NULL 
                    AND longitude IS NOT NULL
                    ORDER BY RANDOM()
                    LIMIT 1
                """), {'theme_id': theme_id}).fetchall()
                
                if spots:
                    selected_spots.append(dict(zip(['id', 'name', 'theme_id', 'latitude', 'longitude'], spots[0])))
            except Exception as e:
                print(f"테마 {theme_id} 관광지 조회 실패: {e}")
                continue
        
        if not selected_spots:
            return None
        
        # 루트 정보 생성
        route_name = f"추천 루트 {len(selected_spots)}개 관광지"
        total_distance = calculate_route_distance(selected_spots)
        
        return {
            'name': route_name,
            'spots': selected_spots,
            'total_distance': total_distance,
            'estimated_time': len(selected_spots) * 2,  # 관광지당 2시간
            'recommended': True
        }
        
    except Exception as e:
        print(f"단일 추천 루트 생성 실패: {e}")
        return None

def calculate_route_distance(spots: list):
    """루트 총 거리 계산"""
    try:
        total_distance = 0
        for i in range(len(spots) - 1):
            spot1 = spots[i]
            spot2 = spots[i + 1]
            
            if spot1['latitude'] and spot1['longitude'] and spot2['latitude'] and spot2['longitude']:
                distance = calculate_distance(
                    spot1['latitude'], spot1['longitude'],
                    spot2['latitude'], spot2['longitude']
                )
                total_distance += distance
        
        return round(total_distance, 2)
        
    except Exception as e:
        print(f"거리 계산 실패: {e}")
        return 0

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float):
    """두 점 간의 거리 계산 (Haversine 공식)"""
    import math
    
    R = 6371  # 지구의 반지름 (km)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat/2) * math.sin(dlat/2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon/2) * math.sin(dlon/2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

# 간단한 직선 거리 계산 (기본 기능)
@app.post('/api/calculate-simple-distance')
async def calculate_simple_distance(route_data: dict):
    """간단한 직선 거리 계산"""
    try:
        spots = route_data.get('spots', [])
        if len(spots) < 2:
            return {'error': '최소 2개의 관광지가 필요합니다'}
        
        total_distance = 0
        route_details = []
        
        for i in range(len(spots) - 1):
            # Haversine 공식으로 직선 거리 계산
            straight_distance = calculate_distance(
                spots[i]['latitude'], spots[i]['longitude'],
                spots[i+1]['latitude'], spots[i+1]['longitude']
            )
            
            total_distance += straight_distance
            route_details.append({
                'from': spots[i]['name'],
                'to': spots[i+1]['name'],
                'distance_km': round(straight_distance, 2),
                'duration_minutes': round(straight_distance * 1.5, 1),
                'note': '직선 거리'
            })
        
        return {
            'total_distance_km': round(total_distance, 2),
            'total_distance_meters': int(total_distance * 1000),
            'route_details': route_details,
            'spot_count': len(spots)
        }
        
    except Exception as e:
        logger.error(f"거리 계산 실패: {e}")
        return {'error': f'거리 계산 실패: {str(e)}'}

def save_user_feedback(user_id: int, feedback_data: dict, db: Session):
    """사용자 피드백 저장"""
    try:
        # 피드백 테이블이 없다면 생성 (실제로는 마이그레이션 필요)
        db.execute(sqlalchemy.text("""
            CREATE TABLE IF NOT EXISTS user_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                recommendation_type VARCHAR(50),
                item_id INTEGER,
                rating INTEGER,
                feedback_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # 피드백 저장
        db.execute(sqlalchemy.text("""
            INSERT INTO user_feedback (user_id, recommendation_type, item_id, rating, feedback_text)
            VALUES (:user_id, :type, :item_id, :rating, :feedback)
        """), {
            'user_id': user_id,
            'type': feedback_data.get('type'),
            'item_id': feedback_data.get('item_id'),
            'rating': feedback_data.get('rating'),
            'feedback': feedback_data.get('feedback')
        })
        
        db.commit()
        
    except Exception as e:
        print(f"피드백 저장 실패: {e}")
        db.rollback()

def update_recommendation_model(user_id: int, feedback_data: dict, db: Session):
    """추천 모델 실시간 업데이트 (간단한 버전)"""
    try:
        # 실제로는 더 복잡한 머신러닝 모델 업데이트가 필요
        # 여기서는 간단한 사용자 선호도 업데이트만 수행
        
        if feedback_data.get('rating', 0) >= 4:  # 높은 평점
            # 해당 아이템의 가중치 증가
            pass
        elif feedback_data.get('rating', 0) <= 2:  # 낮은 평점
            # 해당 아이템의 가중치 감소
            pass
            
    except Exception as e:
        print(f"모델 업데이트 실패: {e}")

# 프로필 관련 API
@app.get('/api/profile')
async def get_profile(request: Request, db: Session = Depends(get_db)):
    """내 프로필 정보 조회"""
    try:
        user_id = get_current_user_id(request)
        
        # 사용자 정보 조회
        user_result = db.execute(sqlalchemy.text("""
            SELECT username, email, created_at 
            FROM users 
            WHERE id = :user_id
        """), {'user_id': user_id})
        
        user = user_result.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
        # 내 루트 개수 조회
        route_count_result = db.execute(sqlalchemy.text("""
            SELECT COUNT(*) 
            FROM user_routes 
            WHERE user_id = :user_id
        """), {'user_id': user_id})
        
        route_count = route_count_result.fetchone()[0]
        
        # 방문한 관광지 개수 조회 (루트에 포함된 관광지)
        visited_spots_result = db.execute(sqlalchemy.text("""
            SELECT COUNT(DISTINCT rs.spot_id) 
            FROM route_spots rs 
            JOIN user_routes ur ON rs.route_id = ur.id 
            WHERE ur.user_id = :user_id
        """), {'user_id': user_id})
        
        visited_spots_count = visited_spots_result.fetchone()[0]
        
        # SQLite는 날짜를 문자열로 반환하므로 isoformat() 체크 수정
        created_at = user[2]
        if created_at and hasattr(created_at, 'isoformat'):
            created_at = created_at.isoformat()
        
        return {
            'user_id': user_id,
            'username': user[0],
            'email': user[1],
            'created_at': created_at,
            'stats': {
                'total_routes': route_count,
                'visited_spots': visited_spots_count
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"프로필 조회 실패: {e}")
        return {'error': f'프로필 조회 실패: {str(e)}'}

@app.get('/api/my-routes')
async def get_my_routes(request: Request, db: Session = Depends(get_db)):
    """내가 만든 루트 목록 조회"""
    try:
        user_id = get_current_user_id(request)
        
        # 내 루트 목록 조회
        routes_result = db.execute(sqlalchemy.text("""
            SELECT id, name, description, estimated_time, total_distance, created_at
            FROM user_routes 
            WHERE user_id = :user_id 
            ORDER BY created_at DESC
        """), {'user_id': user_id})
        
        routes = routes_result.fetchall()
        route_list = []
        
        for route in routes:
            # SQLite는 날짜를 문자열로 반환하므로 isoformat() 체크 수정
            created_at = route[5]
            if created_at and hasattr(created_at, 'isoformat'):
                created_at = created_at.isoformat()
            
            route_list.append({
                'id': route[0],
                'name': route[1],
                'description': route[2],
                'estimated_time': route[3],
                'total_distance': route[4],
                'created_at': created_at
            })
        
        return {'routes': route_list}
        
    except Exception as e:
        logger.error(f"내 루트 조회 실패: {e}")
        return {'error': f'내 루트 조회 실패: {str(e)}'}

@app.put('/api/routes/{route_id}')
async def update_route(route_id: int, route_data: dict, request: Request, db: Session = Depends(get_db)):
    """루트 수정"""
    try:
        user_id = get_current_user_id(request)
        
        # 루트 소유권 확인
        route_result = db.execute(sqlalchemy.text("""
            SELECT id FROM user_routes WHERE id = :route_id AND user_id = :user_id
        """), {'route_id': route_id, 'user_id': user_id})
        
        if not route_result.fetchone():
            raise HTTPException(status_code=404, detail="루트를 찾을 수 없습니다")
        
        # 루트 이름 업데이트
        db.execute(sqlalchemy.text("""
            UPDATE user_routes 
            SET name = :name 
            WHERE id = :route_id AND user_id = :user_id
        """), {
            'name': route_data.get('name'),
            'route_id': route_id,
            'user_id': user_id
        })
        
        # 기존 관광지들 삭제
        db.execute(sqlalchemy.text("""
            DELETE FROM route_spots WHERE route_id = :route_id
        """), {'route_id': route_id})
        
        # 새로운 관광지들 추가
        spots = route_data.get('spots', [])
        for i, spot_id in enumerate(spots):
            db.execute(sqlalchemy.text("""
                INSERT INTO route_spots (route_id, spot_id, spot_order)
                VALUES (:route_id, :spot_id, :spot_order)
            """), {
                'route_id': route_id,
                'spot_id': spot_id,
                'spot_order': i
            })
        
        db.commit()
        return {'message': '루트 수정 성공'}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"루트 수정 실패: {e}")
        return {'error': f'루트 수정 실패: {str(e)}'}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
