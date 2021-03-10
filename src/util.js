import Chance from 'chance'

const chance = new Chance()

// 给数字字符串补零
function preZeroFill (num, size) {
  if (num >= Math.pow(10, size)) { // 如果num本身位数不小于size位
    return num.toString()
  } else {
    const _str = Array(size + 1).join('0') + num
    return _str.slice(_str.length - size)
  }
}

/**
 * 获取指定位数的整数随机数
 * @param  {int} size 位数
 * @return {string}     定位数的整数随机数字符串
 */
export const getIntRandom = (size) => preZeroFill(chance.integer({
  min: 0,
  max: Array(size + 1).join(9)
}), size)
