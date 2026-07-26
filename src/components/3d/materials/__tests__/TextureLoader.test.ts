import { describe, expect, it } from 'vitest'
import { resolveAnatomyTexturePath } from '../TextureLoader'

describe('resolveAnatomyTexturePath', () => {
  it('keeps anatomy textures under the configured deployment base path', () => {
    expect(
      resolveAnatomyTexturePath(
        'textures/anatomy/nasal-septum_standard.png',
        '/simulation-game/'
      )
    ).toBe('/simulation-game/textures/anatomy/nasal-septum_standard.png')
  })

  it('normalizes missing and duplicate slashes', () => {
    expect(
      resolveAnatomyTexturePath(
        '/textures/anatomy/ica_standard.png',
        '/simulation-game'
      )
    ).toBe('/simulation-game/textures/anatomy/ica_standard.png')
  })
})
