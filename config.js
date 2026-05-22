// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Firebase 설정
//  Firebase Console → 프로젝트 설정 → 내 앱 → SDK 설정 및 구성
//  에서 아래 값을 채워주세요.
//
//  Realtime Database 보안 규칙 (Firebase Console → 규칙):
//  {
//    "rules": { ".read": true, ".write": true }
//  }
//
//  ※ Firebase 클라이언트 키는 공개 설계이므로 git 커밋 가능합니다.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const firebaseConfig = {
    apiKey:            '',
    authDomain:        '',
    databaseURL:       '',   // 필수! 예: 'https://xxx-default-rtdb.firebaseio.com'
    projectId:         '',
    storageBucket:     '',
    messagingSenderId: '',
    appId:             ''
}
