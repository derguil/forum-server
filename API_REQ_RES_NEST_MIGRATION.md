# forumserver API req/res 정리 (NestJS 리팩토링 기준)

기준 코드: `serverProject` (Express + MongoDB + Session + Socket.IO)

> 아래 `2) REST API 상세`는 **현재 Express 동작 원본 스펙**입니다.
> 
> `6) JWT + MySQL 타겟 스펙`은 **리팩토링 목표 스펙**입니다.

## 1) 공통 규칙

- Base Path
  - REST: `/api` (단, 인증 라우트는 `/api/auth`)
- 인증
  - 세션 기반 (`connect.sid` 쿠키)
  - `requireLogin` 미들웨어 실패 시: `401 { message: "로그인이 필요합니다" }`
- Body 파서
  - `express.json()`, `express.urlencoded({ extended: true })`
- 업로드
  - 게시글 이미지: `multipart/form-data`, 필드 `images` (최대 20)
  - 프로필 이미지: `multipart/form-data`, 필드 `profileImg` (단일)
- ObjectId
  - 대부분 ID는 문자열로 전달되어 서버에서 `new ObjectId(...)` 처리

---

## 2) REST API 상세

## A. Auth (`/api/auth`)

### 1. GET `/api/auth/me`
- Auth: 필요
- Request
  - session: `userId`
- Success `200`
  - `{ success: true, message: "로그인됨", user }`
  - `user`는 `passwordHash` 제외
- Error
  - `404 { success: false, message: "유저 없음" }`
  - `500 { success: false, message: "서버 오류" }`

### 2. POST `/api/auth/register`
- Auth: 불필요
- Request Body
  - `username: string`
  - `email: string`
  - `password: string`
  - `password2: string`
- Success `200`
  - `{ success: true, message: "회원가입 완료" }`
- Error
  - `400 { success: false, message: "필수값 누락" }`
  - `400 { success: false, message: "확인 비번 불일치" }`
  - `409 { success: false, message: "이미 존재하는 아이디" }`

### 3. POST `/api/auth/login`
- Auth: 불필요
- Request Body
  - `username: string`
  - `password: string`
- Success `200`
  - session에 `userId` 저장
  - `{ success: true, message: "로그인 성공", user: safeUser }`
- Error
  - `401 { success: false, message: "존재하지 않는 아이디" }`
  - `401 { success: false, message: "비밀번호가 틀렸습니다" }`

### 4. POST `/api/auth/logout`
- Auth: 필요
- Success `200`
  - 세션 destroy + `connect.sid` clear
  - `{ success: true, message: "로그아웃 완료" }`
- Error
  - `500 { success: false, message: "로그아웃 실패" }`

---

## B. Forums (`/api`)

### 1. GET `/api/reqForums`
- Auth: 불필요
- Success `200`
  - `{ success: true, forums: Forum[] }`

### 2. GET `/api/reqForum`
- Auth: 불필요
- Query
  - `forumid: string(ObjectId)`
- Success `200`
  - `{ success: true, forum: Forum | null }`

### 3. POST `/api/addForum`
- Auth: 필요
- Body
  - `forumName: string`
- Success `200`
  - `{ success: true }`
- Error
  - `400 { success: false, message: "게시판 이름을 입력하세요" }`

---

## C. Posts (`/api`)

### 1. GET `/api/reqUserActivity`
- Auth: 코드상 미들웨어 없음 (단, 내부에서 `req.session.userId` 사용)
- Query
  - `tab: "posts" | "comments" | "scraps"`
  - `currPage: number string`
  - `limit: number string`
- Success `200`
  - `{ success: true, posts: Post[], totalPostsCount: number }`

### 2. GET `/api/reqPosts`
- Auth: 불필요
- Query
  - `forumid: string(ObjectId)`
  - `currPage: number string`
  - `limit: number string`
- Success `200`
  - `{ success: true, posts: Post[], totalPostsCount: number }`

### 3. GET `/api/reqPost`
- Auth: 불필요 (로그인 시 스크랩 여부 계산)
- Query
  - `postid: string(ObjectId)`
- Success `200`
  - `{ success: true, post: PostWithWriter | undefined, isScrapped: boolean }`

### 4. POST `/api/writePost`
- Auth: 필요
- Content-Type: `multipart/form-data`
- Body
  - `parent_id: string(ObjectId)`
  - `title: string`
  - `content: string`
  - `images[]: file` (선택, 최대 20)
- Success `200`
  - `{ success: true }`
- Error
  - `400 { message: "title/content 누락" }`
  - `500 { message: "존재하지 않는 forum!" }`

### 5. POST `/api/editPost`
- Auth: 필요
- Content-Type: `multipart/form-data`
- Body
  - `parent_id: string(ObjectId)`
  - `post_id: string(ObjectId)`
  - `title: string`
  - `content: string`
  - `keepOldImages: string(JSON 배열)`
  - `removedOldKeys: string(JSON 배열)`
  - `images[]: file` (선택, 최대 20)
- Success `200`
  - `{ success: true, message: "수정 완료" }`
- Error
  - `400 { message: "postid/title/content 누락" }`
  - `400 { message: "keepOldImages/removedOldKeys JSON 파싱 실패" }`

### 6. DELETE `/api/post`
- Auth: 필요
- Query
  - `post_id: string(ObjectId)`
- Success `200`
  - `{ success: true }` (soft delete)
- Error
  - `403 { message: "삭제 권한이 없습니다." }`

### 7. POST `/api/postVoteInc`
- Auth: 필요
- Body
  - `forum_id: string(ObjectId)`
  - `post_id: string(ObjectId)`
- Success `200`
  - `{ success: true }`
- Error
  - `400 { success: false, message: "공감은 1일 1회만 가능합니다." }`

### 8. POST `/api/addPostScrap`
- Auth: 필요
- Body
  - `post_id: string(ObjectId)`
- Success `200`
  - `{ success: true }`

### 9. POST `/api/delPostScrap`
- Auth: 필요
- Body
  - `post_id: string(ObjectId)`
- Success `200`
  - `{ success: true }`
- Error
  - `400 { success: false, message: "이미 스크랩이 해제되었습니다." }`

---

## D. Ranked Posts (`/api`)

### 1. GET `/api/reqTrendPosts`
- Auth: 불필요
- Success `200`
  - `{ success: true, trendposts: Post[] }`

### 2. GET `/api/reqHotPosts`
- Auth: 불필요
- Query
  - `currPage: number string`
  - `limit: number string`
- Success `200`
  - `{ success: true, posts: Post[], totalPostsCount: number }`

### 3. GET `/api/reqBestPosts`
- Auth: 불필요
- Query
  - `currPage: number string`
  - `limit: number string`
- Success `200`
  - `{ success: true, posts: Post[], totalPostsCount: number }`

---

## E. Comments (`/api`)

### 1. GET `/api/reqComments`
- Auth: 불필요
- Query
  - `postid: string(ObjectId)`
- Success `200`
  - `{ success: true, comments: Comment[] }`

### 2. POST `/api/writeComment`
- Auth: 필요
- Body
  - `parent_id: string(ObjectId)`
  - `comment: string`
- Success `200`
  - `{ success: true }`

### 3. DELETE `/api/comment`
- Auth: 필요
- Query
  - `comment_id: string(ObjectId)`
  - `postid: string(ObjectId)`
- Success `200`
  - `{ success: true }` (soft delete)
- Error
  - `404 { success: false, message: "댓글을 찾을 수 없습니다." }`
  - `400 { success: false, message: "이미 삭제된 댓글입니다." }`

---

## F. My Page (`/api`)

### 1. GET `/api/me`
- Auth: 필요
- Success `200`
  - `{ username, email, profileImg }`
- Error
  - `404 { message: "유저 정보를 찾을 수 없습니다" }`

### 2. PATCH `/api/me/username`
- Auth: 필요
- Body
  - `username: string`
- Success `200`
  - `{ message: "아이디 변경 완료" }`
- Error
  - `400 { message: "아이디가 필요합니다" }`
  - `409 { message: "이미 사용 중인 아이디" }`

### 3. PATCH `/api/me/email`
- Auth: 필요
- Body
  - `email: string`
- Success `200`
  - `{ message: "email 변경 완료" }`
- Error
  - `400 { message: "email이 필요합니다" }`
  - `409 { message: "이미 사용 중인 이메일" }`

### 4. PUT `/api/me/profile-image`
- Auth: 필요
- Content-Type: `multipart/form-data`
- Body
  - `profileImg: file`
- Success `200`
  - `{ message: "프로필 사진 변경 완료", profileImg }`
- Error
  - `400 { message: "프로필 이미지가 필요합니다" }`

### 5. PATCH `/api/me/password`
- Auth: 필요
- Body
  - `currentPassword: string`
  - `newPassword: string`
- Success `200`
  - 세션 종료 후 `{ message: "비밀번호 변경 완료. 다시 로그인하세요." }`
- Error
  - `400 { message: "비밀번호 정보가 필요합니다" }`
  - `404 { message: "유저를 찾을 수 없습니다" }`
  - `401 { message: "현재 비밀번호가 틀렸습니다" }`

---

## G. Chatting (`/api`)

### 1. POST `/api/threads`
- Auth: 코드상 미들웨어 없음 (단, 내부에서 `req.session.userId` 사용)
- Body
  - `post_id: string(ObjectId)`
- Success `200`
  - 기존 스레드: `{ threadId, isNew: false }`
  - 신규 생성: `{ threadId, isNew: true }`
- Error
  - `404 { message: "게시글을 찾을 수 없습니다." }`
  - `400 { message: "본인에게는 쪽지를 보낼 수 없습니다." }`

### 2. GET `/api/reqThreads`
- Auth: 코드상 미들웨어 없음 (단, 내부에서 `req.session.userId` 사용)
- Success `200`
  - `{ success: true, threads }`

### 3. GET `/api/reqMessages`
- Auth: 코드상 미들웨어 없음 (단, 내부에서 `req.session.userId` 사용)
- Query
  - `threadid: string(ObjectId)`
- Success `200`
  - `{ success: true, threadChats: { _id, thread_id, text, sent, createdAt }[] }`

---

## H. SocketIO Chat REST (`/api`)

### 1. POST `/api/sendMessage`
- Auth: 필요
- Body
  - `threadid: string(ObjectId)`
  - `text: string`
- Success `200`
  - `{ success: true }`
  - 부수효과: Socket.IO 이벤트 emit
    - room `thread:{threadid}` -> `broadcast`
    - room `user:{myId}` -> `thread:update`
    - room `user:{otherUserId}` -> `thread:update`
- Error
  - `400 { success: false, message: "threadid/text 필요" }`
  - `403 { success: false, message: "thread 접근 권한 없음" }`
  - `500 { success: false, message: "상대 유저 식별 실패" }`

---

## 3) Socket.IO 이벤트 계약

서버 연결 시 인증
- session 미존재 시 연결 거부: `UNAUTHORIZED`

클라이언트 -> 서버
- `user:join` payload: `userId`
  - join room: `user:{userId}`
- `thread:join` payload: `threadId`
  - join room: `thread:{threadId}`
- `thread:leave` payload: `threadId`
  - leave room: `thread:{threadId}`

서버 -> 클라이언트
- `broadcast`
  - `{ _id, thread_id, text, sent, createdAt }`
- `thread:update`
  - `{ thread_id, lastMessage, updatedAt, unreadCountInc }`

---

## 4) NestJS 리팩토링 매핑 제안

현재 API를 최대한 유지하는 기준(프론트 영향 최소화)으로 매핑.

- `AuthModule`
  - `AuthController`: `/auth/me`, `/auth/register`, `/auth/login`, `/auth/logout`
  - `AuthService`
  - DTO: `RegisterDto`, `LoginDto`

- `ForumsModule`
  - `ForumsController`: `/reqForums`, `/reqForum`, `/addForum`
  - DTO: `GetForumQueryDto`, `AddForumDto`

- `PostsModule`
  - `PostsController`: `/reqUserActivity`, `/reqPosts`, `/reqPost`, `/writePost`, `/editPost`, `DELETE /post`, `/postVoteInc`, `/addPostScrap`, `/delPostScrap`
  - DTO: `ReqUserActivityQueryDto`, `ReqPostsQueryDto`, `ReqPostQueryDto`, `WritePostDto`, `EditPostDto`, `PostVoteIncDto`, `PostScrapDto`
  - Interceptor: `FilesInterceptor('images', 20)`

- `RankedPostsModule`
  - `RankedPostsController`: `/reqTrendPosts`, `/reqHotPosts`, `/reqBestPosts`
  - DTO: `PaginationQueryDto`

- `CommentsModule`
  - `CommentsController`: `/reqComments`, `/writeComment`, `DELETE /comment`
  - DTO: `ReqCommentsQueryDto`, `WriteCommentDto`, `DeleteCommentQueryDto`

- `MyPageModule`
  - `MyPageController`: `/mypage`, `/chusername`, `/chemail`, `/chprofileimg`, `/chpassword`
  - DTO: `ChangeUsernameDto`, `ChangeEmailDto`, `ChangePasswordDto`
  - Interceptor: `FileInterceptor('profileImg')`

- `ChattingModule`
  - `ChattingController`: `/threads`, `/reqThreads`, `/reqMessages`, `/sendMessage`
  - `ChatGateway` (Socket.IO)
  - DTO: `CreateThreadDto`, `ReqMessagesQueryDto`, `SendMessageDto`

### 공통 Nest 권장사항
- 인증
  - `SessionAuthGuard` 생성 후 현재 `requireLogin` 역할 통합
  - 현재 Express 코드에서 누락된 `/threads`, `/reqThreads`, `/reqMessages`, `/reqUserActivity`는 Guard 적용 권장
- 검증
  - `ValidationPipe({ whitelist: true, transform: true })`
  - `class-validator`로 query/body 형식 강제
- 예외 처리
  - `HttpExceptionFilter`로 응답 포맷 일관화 (`success`, `message`, `data`)
- API 문서
  - Swagger(`@nestjs/swagger`)로 DTO 기반 자동 문서화

---

## 5) 마이그레이션 우선순위 제안

1. 인증/세션/가드 공통 인프라부터 Nest로 이관
2. `auth`, `forums`, `posts`, `comments` 순으로 REST 이관
3. `chatting + socket gateway` 이관
4. 기존 응답 포맷 회귀 테스트로 프론트 호환성 확인

---

## 6) JWT + MySQL 타겟 스펙 (변경안)

## A. 핵심 아키텍처 변경

- 인증
  - Session(`connect.sid`) 제거
  - JWT 기반으로 변경 (`accessToken`, `refreshToken`)
  - 보호 API는 `Authorization: Bearer <accessToken>` 사용
- DB
  - MongoDB(ObjectId) -> MySQL(정수 PK 또는 UUID)
  - ORM은 Nest에서 `Prisma` 권장
- Socket.IO 인증
  - 핸드셰이크 시 JWT 검증 (`handshake.auth.token` 또는 `Authorization`)

## B. 인증 API 타겟 (권장)

### 1. POST `/api/auth/register`
- 유지 가능
- Response 권장
  - `201 { success: true, message: "회원가입 완료" }`

### 2. POST `/api/auth/login`
- 변경
- Body
  - `username: string`
  - `password: string`
- Response 권장
  - `200 { success: true, accessToken, refreshToken, user }`

### 3. POST `/api/auth/refresh`
- 신규
- Body 또는 HttpOnly Cookie로 refresh token 전달
- Response 권장
  - `200 { success: true, accessToken }`

### 4. POST `/api/auth/logout`
- 변경
- 서버에서 refresh token revoke(블랙리스트/버전 증가) 처리
- Response 권장
  - `200 { success: true, message: "로그아웃 완료" }`

### 5. GET `/api/auth/me`
- 유지
- JWT에서 user 식별

## C. ID/필드 마이그레이션 규칙

- `*_id: string(ObjectId)` -> `*_id: number`(auto increment) 또는 `string(UUID)`
- Query string 숫자는 DTO에서 `@Type(() => Number)`로 변환
- 예시
  - `forumid`, `postid`, `threadid`, `comment_id` 전부 MySQL 키 타입으로 통일

## D. Nest 모듈 구성 (JWT + MySQL)

- `AuthModule`
  - `JwtModule`, `PassportModule`
  - `JwtAccessStrategy`, `JwtRefreshStrategy`
  - `JwtAuthGuard`, `JwtRefreshGuard`
- `UsersModule`, `ForumsModule`, `PostsModule`, `CommentsModule`, `ChattingModule`
- `PrismaModule`
  - `PrismaService`로 MySQL 접근 공통화

## E. 공통 응답 포맷 권장

- 성공
  - `{ success: true, data, message? }`
- 실패
  - `{ success: false, message, errorCode?, details? }`

현재 Express의 `res.send/res.json` 혼재를 Nest에서 하나로 통일 권장.

## F. 마이그레이션 순서 (JWT + MySQL 버전)

1. Prisma 스키마 설계 (`users/forums/posts/comments/threads/messages/votes/rankings`)
2. `AuthModule` JWT 발급/재발급/로그아웃 구현
3. 기존 `requireLogin` 구간을 `JwtAuthGuard`로 일괄 치환
4. `posts/comments/forums`를 Mongo 쿼리 -> Prisma 쿼리로 전환
5. `chatting/socket`의 세션 의존 제거 후 JWT 핸드셰이크로 전환
6. 프론트 토큰 저장/갱신 흐름(401 인터셉터 포함) 맞춤

## G. 주의사항

- 기존 API path를 유지하면 프론트 변경량 최소화 가능
- 다만 인증 실패 코드/메시지, 로그인 응답(payload)은 프론트 수정 필요 가능성이 큼
- refresh token 저장 위치(Cookie vs Storage)는 보안 정책 먼저 확정 필요
