/**
 * The canonical internal unit is the inch (SPEC §4). Three renders in feet,
 * where 1 scene unit = 1 foot, and this module is the only place where the two
 * systems are allowed to meet. Nothing outside this file mixes units.
 */

export const IN_PER_FT = 12
export const IN3_PER_FT3 = IN_PER_FT ** 3

export function inToFt(inches: number): number {
  return inches / IN_PER_FT
}

export function ftToIn(feet: number): number {
  return feet * IN_PER_FT
}

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Formats a length in inches the way a takeoff sheet reads it: `12' 6"`.
 * Fractional inches keep one decimal; whole inches lose the decimal point.
 */
export function formatFeetInches(totalInches: number): string {
  const sign = totalInches < 0 ? '-' : ''
  const abs = Math.abs(totalInches)

  let feet = Math.floor(abs / IN_PER_FT)
  let inches = Math.round((abs - feet * IN_PER_FT) * 10) / 10

  // Rounding can push the remainder up to a whole foot.
  if (inches >= IN_PER_FT) {
    feet += 1
    inches -= IN_PER_FT
  }

  return `${sign}${feet}' ${inches}"`
}

export function cubicInchesToCubicFeet(cubicInches: number): number {
  return cubicInches / IN3_PER_FT3
}

/**
 * Quantities read as whole numbers where they are whole and to one decimal
 * where they are not, so 84 units does not render as 84.0 tons of precision it
 * does not have.
 */
export function formatQuantity(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded)
    ? rounded.toLocaleString('en-US')
    : rounded.toLocaleString('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
}

export function formatUsd(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}
