# Wishory

계절별 위시리스트 및 쇼핑 기록 관리 앱

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Node.js, Express
- **데이터 저장**: JSON 파일 기반 (data.json)

## 프로젝트 구조

```
wishory/
├── index.html          # 프론트엔드 HTML
├── style.css          # 스타일시트
├── script.js          # 프론트엔드 JavaScript
├── server.js          # Express 백엔드 서버
├── data.json          # 데이터 저장 파일
├── package.json       # Node.js 의존성 관리
└── README.md          # 프로젝트 문서
```

## 설치 및 실행 방법

### 1. 프로젝트 초기화

```bash
npm install
```

이 명령어는 다음 패키지들을 설치합니다:
- `express`: 웹 서버 프레임워크
- `cors`: Cross-Origin Resource Sharing 지원

### 2. 서버 실행

```bash
npm start
```

또는

```bash
node server.js
```

서버가 성공적으로 시작되면 다음 메시지가 표시됩니다:
```
Server is running on http://localhost:3000
```

### 3. 브라우저에서 접속

브라우저에서 `http://localhost:3000`을 열어 애플리케이션을 사용할 수 있습니다.

## 주요 기능

### 1. 인증 시스템
- 회원가입 (ID 중복 체크, 비밀번호 최대 16자 제한)
- 로그인/로그아웃
- 인증 가드 (비로그인 시 장바구니, 주문 내역, 위시리스트 접근 제한)

### 2. 계절별 위시리스트
- Spring, Summer, Fall, Winter 네 가지 계절별 위시리스트
- 카테고리 필터링 (All, Outer, Top, Bottom, Dress, Shoes, Accessories)
- 아이템 추가/수정/삭제 기능
- 상품 링크 클릭 시 새 창에서 열기

### 3. 히어로 슬라이더
- 자동 재생 (4초 간격)
- 좌우 화살표 네비게이션
- 하단 Dot 인디케이터
- 무한 루프

### 4. Wishory Highlights 마퀴
- 랜덤 8개 아이템 표시
- 무한 스크롤 애니메이션
- 마우스 오버 시 일시정지

### 5. 쇼핑 장바구니
- 아이템 추가/수량 조절/삭제
- 체크아웃 폼 (이름, 전화번호, 주소, 은행, 계좌 비밀번호)

### 6. 주문 내역
- 과거 주문 내역 조회
- 날짜 범위 필터링

## API 엔드포인트

### Items
- `GET /api/items` - 전체 상품 리스트 조회
- `POST /api/items` - 새 아이템 추가
- `PUT /api/items/:id` - 아이템 수정
- `DELETE /api/items/:id` - 아이템 삭제

### Authentication
- `POST /api/auth/login` - 로그인
- `POST /api/auth/signup` - 회원가입

### Cart
- `GET /api/cart/:userId` - 사용자 장바구니 조회
- `POST /api/cart/:userId` - 장바구니에 아이템 추가
- `PUT /api/cart/:userId/:index` - 장바구니 아이템 수량 수정
- `DELETE /api/cart/:userId/:index` - 장바구니 아이템 삭제
- `DELETE /api/cart/:userId` - 장바구니 비우기

### Orders
- `GET /api/orders/:userId` - 사용자 주문 내역 조회
- `POST /api/orders/:userId` - 새 주문 생성

## 데이터 구조

### Item (상품)
```json
{
  "id": "string",
  "name": "string",
  "price": "number",
  "season": "Spring|Summer|Fall|Winter",
  "category": "Outer|Top|Bottom|Dress|Shoes|Accessories",
  "url": "string (상품 링크)",
  "imageUrl": "string (이미지 URL)"
}
```

## 계절별 테마

- **Spring**: Pink / Pastel Green
- **Summer**: Blue / White
- **Fall**: Brown / Orange
- **Winter**: Navy / Grey

## 주의사항

1. 서버를 실행하기 전에 반드시 `npm install`을 실행하여 의존성을 설치하세요.
2. `data.json` 파일은 서버가 자동으로 생성하므로 수동으로 생성할 필요가 없습니다.
3. CORS가 활성화되어 있어 로컬 개발 환경에서 정상적으로 작동합니다.

## 문제 해결

### 서버가 시작되지 않는 경우
- 포트 3000이 이미 사용 중인지 확인하세요.
- `node_modules` 폴더가 있는지 확인하고, 없다면 `npm install`을 실행하세요.

### API 요청이 실패하는 경우
- 서버가 실행 중인지 확인하세요.
- 브라우저 콘솔에서 에러 메시지를 확인하세요.
- CORS 설정이 올바른지 확인하세요.

## 라이선스

ISC
