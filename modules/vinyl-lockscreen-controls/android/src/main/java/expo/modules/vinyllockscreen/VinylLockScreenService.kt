package expo.modules.vinyllockscreen

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.media.app.NotificationCompat as MediaNotificationCompat

class VinylLockScreenService : Service() {
  private lateinit var mediaSession: MediaSessionCompat
  private var title: String = ""
  private var artist: String = ""
  private var albumTitle: String = ""
  private var playing: Boolean = false

  override fun onCreate() {
    super.onCreate()
    ensureChannel()
    mediaSession = MediaSessionCompat(this, SESSION_TAG).apply {
      isActive = true
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_SYNC -> {
        syncFromIntent(intent)
        updateSession()
        postForegroundNotification()
      }
      ACTION_REMOTE_TOGGLE -> VinylLockScreenModule.dispatchRemoteAction("toggle")
      ACTION_REMOTE_NEXT -> VinylLockScreenModule.dispatchRemoteAction("next")
      ACTION_REMOTE_PREVIOUS -> VinylLockScreenModule.dispatchRemoteAction("previous")
      ACTION_REMOTE_PLAY -> VinylLockScreenModule.dispatchRemoteAction("play")
      ACTION_REMOTE_PAUSE -> VinylLockScreenModule.dispatchRemoteAction("pause")
      ACTION_STOP -> {
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        return START_NOT_STICKY
      }
    }

    return START_STICKY
  }

  override fun onDestroy() {
    try {
      mediaSession.isActive = false
      mediaSession.release()
    } catch (_: Exception) {
    }
    super.onDestroy()
  }

  private fun syncFromIntent(intent: Intent) {
    title = intent.getStringExtra(EXTRA_TITLE) ?: ""
    artist = intent.getStringExtra(EXTRA_ARTIST) ?: ""
    albumTitle = intent.getStringExtra(EXTRA_ALBUM_TITLE) ?: ""
    playing = intent.getBooleanExtra(EXTRA_PLAYING, false)
  }

  private fun updateSession() {
    val state = if (playing) {
      PlaybackStateCompat.STATE_PLAYING
    } else {
      PlaybackStateCompat.STATE_PAUSED
    }
    val actions =
      PlaybackStateCompat.ACTION_PLAY or
        PlaybackStateCompat.ACTION_PAUSE or
        PlaybackStateCompat.ACTION_PLAY_PAUSE or
        PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
        PlaybackStateCompat.ACTION_SKIP_TO_NEXT

    mediaSession.setPlaybackState(
      PlaybackStateCompat.Builder()
        .setActions(actions)
        .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f)
        .build()
    )

    mediaSession.setMetadata(
      MediaMetadataCompat.Builder()
        .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
        .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
        .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, albumTitle)
        .build()
    )
  }

  private fun postForegroundNotification() {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun buildNotification(): Notification {
    val playPauseAction =
      if (playing) {
        NotificationCompat.Action(
          android.R.drawable.ic_media_pause,
          "Pause",
          servicePendingIntent(ACTION_REMOTE_TOGGLE, 1002)
        )
      } else {
        NotificationCompat.Action(
          android.R.drawable.ic_media_play,
          "Play",
          servicePendingIntent(ACTION_REMOTE_TOGGLE, 1002)
        )
      }

    val builder =
      NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(applicationInfo.icon)
        .setContentTitle(title.ifBlank { "Vinyl" })
        .setContentText(artist.ifBlank { "Local Music" })
        .setSubText(albumTitle.ifBlank { null })
        .setContentIntent(contentPendingIntent())
        .setDeleteIntent(servicePendingIntent(ACTION_STOP, 1010))
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setOnlyAlertOnce(true)
        .setShowWhen(false)
        .setOngoing(playing)
        .addAction(
          NotificationCompat.Action(
            android.R.drawable.ic_media_previous,
            "Previous",
            servicePendingIntent(ACTION_REMOTE_PREVIOUS, 1001)
          )
        )
        .addAction(playPauseAction)
        .addAction(
          NotificationCompat.Action(
            android.R.drawable.ic_media_next,
            "Next",
            servicePendingIntent(ACTION_REMOTE_NEXT, 1003)
          )
        )
        .setStyle(
          MediaNotificationCompat.MediaStyle()
            .setMediaSession(mediaSession.sessionToken)
            .setShowActionsInCompactView(0, 1, 2)
        )

    return builder.build()
  }

  private fun contentPendingIntent(): PendingIntent? {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName) ?: return null
    return PendingIntent.getActivity(
      this,
      1000,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun servicePendingIntent(action: String, requestCode: Int): PendingIntent {
    val intent = Intent(this, VinylLockScreenService::class.java).apply {
      this.action = action
    }
    return PendingIntent.getService(
      this,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun ensureChannel() {
    val manager = getSystemService(NotificationManager::class.java) ?: return
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    manager.createNotificationChannel(
      NotificationChannel(
        CHANNEL_ID,
        "Playback",
        NotificationManager.IMPORTANCE_LOW
      )
    )
  }

  companion object {
    const val ACTION_SYNC = "expo.modules.vinyllockscreen.ACTION_SYNC"
    const val ACTION_STOP = "expo.modules.vinyllockscreen.ACTION_STOP"
    const val ACTION_REMOTE_TOGGLE = "expo.modules.vinyllockscreen.ACTION_REMOTE_TOGGLE"
    const val ACTION_REMOTE_NEXT = "expo.modules.vinyllockscreen.ACTION_REMOTE_NEXT"
    const val ACTION_REMOTE_PREVIOUS = "expo.modules.vinyllockscreen.ACTION_REMOTE_PREVIOUS"
    const val ACTION_REMOTE_PLAY = "expo.modules.vinyllockscreen.ACTION_REMOTE_PLAY"
    const val ACTION_REMOTE_PAUSE = "expo.modules.vinyllockscreen.ACTION_REMOTE_PAUSE"
    const val EXTRA_TITLE = "extra_title"
    const val EXTRA_ARTIST = "extra_artist"
    const val EXTRA_ALBUM_TITLE = "extra_album_title"
    const val EXTRA_PLAYING = "extra_playing"

    private const val CHANNEL_ID = "vinyl_playback_controls"
    private const val SESSION_TAG = "vinyl_playback_session"
    private const val NOTIFICATION_ID = 10086
  }
}
