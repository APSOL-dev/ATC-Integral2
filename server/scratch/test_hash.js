function safeParseInt32(val) {
  const num = parseInt(val, 10);
  if (isNaN(num)) return 0;
  if (num <= 2147483647 && num >= -2147483648) {
    return num;
  }
  const str = String(val);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const idDetalleStr = "5642000256420002";
console.log("Value:", idDetalleStr);
console.log("Parsed:", safeParseInt32(idDetalleStr));
