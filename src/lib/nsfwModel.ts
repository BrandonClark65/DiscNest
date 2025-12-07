import * as nsfwjs from 'nsfwjs';
import * as tf from '@tensorflow/tfjs'; // no tfjs-node
declare global {
  var _NSFW_MODEL: nsfwjs.NSFWJS | undefined;
}

/**
 * Safely dispose leftover variables in dev mode to prevent
 * "Variable already registered" errors on hot reload.
 */
function disposeDevVariables() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      tf.disposeVariables();
      // also clear backend state to be extra safe
      if (tf.engine().state.registeredVariables) {
        Object.keys(tf.engine().state.registeredVariables).forEach((key) => {
          delete tf.engine().state.registeredVariables[key];
        });
      }
    } catch (err) {
      console.warn('Failed to dispose previous TF variables:', err);
    }
  }
}

export async function getNSFWModel(): Promise<nsfwjs.NSFWJS> {
  if (global._NSFW_MODEL) return global._NSFW_MODEL;

  disposeDevVariables();

  global._NSFW_MODEL = await nsfwjs.load(); // default MobileNetV2
  return global._NSFW_MODEL;
}

export { tf };
