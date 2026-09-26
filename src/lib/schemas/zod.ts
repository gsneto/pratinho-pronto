import { z } from 'zod'

// Configure before constructing schemas: even a caught eval probe violates CSP.
z.config({ jitless: true })

export { z }
