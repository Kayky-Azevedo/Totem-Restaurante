window.onload = () => {
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('payment-message').style.display = 'block';
    }, 5000); // 5 seconds
};
