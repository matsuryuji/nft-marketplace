import { setTransportReady } from '@/shared/api/transport'
import './index.css'

const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false'

const scenarioCaptured = mocksEnabled ? import('@/mocks/scenarios') : Promise.resolve()

if (mocksEnabled) {
  setTransportReady(import('@/mocks/browser').then(({ startMockWorker }) => startMockWorker()))
}

void Promise.all([import('@/app/bootstrap'), scenarioCaptured]).then(([{ mount }]) => mount(document.getElementById('root')!))
