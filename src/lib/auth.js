import JsSHA from 'jssha'
import { SYSTEM } from '../config'

export default (token) => {
  const shaObj = new JsSHA('SHA-512', 'TEXT')
  shaObj.update(SYSTEM.TOKEN)
  const hash = shaObj.getHash('HEX')
  if (token === hash) return true
  return false
}
