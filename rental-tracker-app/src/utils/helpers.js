// Formats YYYY-MM-DD to "Jan 1, 2024"
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Formats numbers to currency
export const formatCurrency = (amount) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(num);
};