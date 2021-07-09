---
title: "[Android] MediaController를 이용한 Third-Party 음악 앱 재생하기"
date: 2020-09-18 10:25:00 +0900
categories: Android
---

최근 새로운 앱을 개발하면서, Third-Party 음악 앱을 재생시킬 방법을 찾아야 했다.

처음에는 AudioManager의 dispatchMediaKeyEvent를 이용하여 재생을 시켰었는데, 재생은 잘 되지만 해당 코드는 오랫동안 음악 앱을 실행 안하면 KeyEvent가 먹지 않는 것 같았다.

(이어폰에 있는 재생 버튼을 클릭해도 종종 재생이 안되는 것과 같은 이유인 것 같다.)

그리고 마지막 Media App을 재생하기 때문에, 원하지 않는 앱이 재생 될 위험성도 있었다.

실제 코드는 다음과 같았다.

```
val eventTime = SystemClock.uptimeMillis() - 1
val audioManager: AudioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
audioManager.dispatchMediaKeyEvent(KeyEvent(eventTime, eventTime, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_MEDIA_PLAY, 0))
audioManager.dispatchMediaKeyEvent(KeyEvent(eventTime, eventTime, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_MEDIA_PLAY, 0))
```

위의 문제점으로 인해 재생도 잘 되고 특정 앱을 지정해서 재생하는 새로운 방법을 찾으려고 한 결과, 한 Stack Overflow 글을 통해 방법을 찾을 수 있었다. (아래 참조 글 첫 번째)

MediaContoller를 이용해서 재생하는 방식으로, 글로 설명하자면 MediaSessionManager를 통해 음악 재생 앱의 MediaSession Token을 획득해 재생을 시켜주는 방식이다.

아래는 직접 작성한 코드이다.

<br>

### MainActivity.kt (일부)
-------------
```
fun playMusicPlayer(packageName: String) {
    // 세션 토큰을 담을 HashMap (Package Name, Token)
    val sessionTokens = hashMapOf<String, MediaSession.Token>()

    // MediaSessionManager
    val mediaSessionManager = this.getSystemService(Context.MEDIA_SESSION_SERVICE) as MediaSessionManager

    // 활성화된 Session 가져오기
    val sessions = mediaSessionManager.getActiveSessions(ComponentName(this, NotificationListenerService::class.java))
    for(session in sessions) {
        // 찾은 Session의 Package Name을 Log로 출력
        Log.d("GetMediaSessionToken", "Find ${session.packageName}")
        
        // HashMap에 저장
        sessionTokens[session.packageName] = session.sessionToken
    }

    // Session Token을 통해 MediaController 생성
    val mediaController = MediaController(this, sessionTokens[packageName]!!)

    // 재생
    mediaController.transportControls.play()
}
```

### NotificationListenerService.kt
-------------
```
import android.service.notification.NotificationListenerService

class NotificationListenerService: NotificationListenerService()
```

### AndroidManifest.xml (일부)
-------------
```
<service android:name=".service.NotificationListenerService"
    android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
    android:enabled="true"
    android:exported="true" >
    <intent-filter>
        <action android:name="android.service.notification NotificationListenerService" />
    </intent-filter>
    </service>
```

<br>

여기서 실제로 재생 가능한 앱, 즉 활성화된 Session을 가져오는 부분을 잘 보자. 

NotificationListenerService를 이용해서 가져온다.
```
// 활성화된 Session 가져오기
val sessions = mediaSessionManager.getActiveSessions(ComponentName(this, NotificationListenerService::class.java))
```

NotificationListenerService는 Notification 정보를 받는 서비스인데, 해당 Service를 사용하려면 특별한 접근에서 알림 접근 허용을 해주어야 한다. 
(Permission으로는 android.permission.BIND_NOTIFICATION_LISTENER_SERVICE)

그리고 NotificationListenerService는 위에서처럼 Extend만 하면 된다. (활성 Session만 가져오기 때문에 크게 다른 구현이 필요 없음)

Service가 구현이 완료되었다면 위의 Manifest XML 파일의 일부분처럼 Service를 등록하면 완료된다.

실제로 구현했을 때 Logcat은 다음과 같이 출력된다. (Melon 앱과 FLO 앱이 설치되어 있는 상태)

```
D/TEST: Find com.iloen.melon
D/TEST: Find skplanet.musicmate
```

일단 이전 방식보다 확실히 재생이 잘 되는 것 같다. 

## 2020.09.19 추가

이게 처음엔 잘 되는줄 알았는데 앱 설치 이후에 음악을 재생하지 않으면 재생이 안되는 것 같긴 한데.. 좀 더 지켜봐야겠다

(근데 바로 재생시키는 앱이 아니라서 나의 경우에는 큰 문제가 없을 것 같긴 하다..)

<br>

### 참조 글
-------------
https://stackoverflow.com/a/53961746

https://stackoverflow.com/a/27114050 