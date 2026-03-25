package expo.modules.vinyllockscreen

import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

class VinylLockScreenModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VinylLockScreen")

    Events(EVENT_REMOTE_ACTION)

    OnCreate {
      instanceRef = WeakReference(this@VinylLockScreenModule)
    }

    OnDestroy {
      instanceRef = null
    }

    AsyncFunction("sync") { title: String, artist: String?, albumTitle: String?, playing: Boolean ->
      val reactContext = appContext.reactContext ?: return@AsyncFunction
      val intent = Intent(reactContext, VinylLockScreenService::class.java).apply {
        action = VinylLockScreenService.ACTION_SYNC
        putExtra(VinylLockScreenService.EXTRA_TITLE, title)
        putExtra(VinylLockScreenService.EXTRA_ARTIST, artist ?: "")
        putExtra(VinylLockScreenService.EXTRA_ALBUM_TITLE, albumTitle ?: "")
        putExtra(VinylLockScreenService.EXTRA_PLAYING, playing)
      }
      try {
        ContextCompat.startForegroundService(reactContext, intent)
      } catch (error: Exception) {
        Log.w(MODULE_TAG, "startForegroundService failed, fallback to startService", error)
        reactContext.startService(intent)
      }
    }

    AsyncFunction("deactivate") {
      val reactContext = appContext.reactContext ?: return@AsyncFunction
      val intent = Intent(reactContext, VinylLockScreenService::class.java).apply {
        action = VinylLockScreenService.ACTION_STOP
      }
      reactContext.startService(intent)
    }
  }

  private fun emitRemoteAction(action: String) {
    appContext.mainQueue.launch {
      sendEvent(EVENT_REMOTE_ACTION, mapOf("action" to action))
    }
  }

  companion object {
    private const val EVENT_REMOTE_ACTION = "onRemoteAction"
    private const val MODULE_TAG = "VinylLockScreenModule"

    @Volatile
    private var instanceRef: WeakReference<VinylLockScreenModule>? = null

    fun dispatchRemoteAction(action: String) {
      instanceRef?.get()?.emitRemoteAction(action)
    }
  }
}
