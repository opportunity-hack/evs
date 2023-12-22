export function formatPhone(phone: String | null) {
    if (phone === null) return ''
    return `${phone.slice(0,3)}-${phone.slice(3,6)}-${phone.slice(6,10)}`
}