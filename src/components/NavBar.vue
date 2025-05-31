<template>
  <nav class="navbar">
    <div class="logo">
      <RouterLink to="/home">
        <img src="/join-bar-logo.png" alt="JoinBar Logo" />
      </RouterLink>
    </div>
    <ul class="nav-links">
      <li><RouterLink to="/map">酒吧地圖</RouterLink></li>
      <li><RouterLink to="/reviews">酒吧評論</RouterLink></li>
      <li><RouterLink to="/events">酒吧活動</RouterLink></li>
      <li><RouterLink to="/subscription">訂閱優惠</RouterLink></li>
      <li><RouterLink to="/member">會員服務</RouterLink></li>
      <li><RouterLink to="/cart"><img class="cart-icon" src="/cart.png" alt="Cart Icon" /></RouterLink></li>
    </ul>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #bbbbbb;
  color: white;
  height: 100px;
}

.logo img {
  height: 50px;
  width: auto;
}

.nav-links {
  list-style: none;
  display: flex;
  gap: 1.5rem;
  align-items: center;
  height: 100%;
}

.nav-links li {
  display: flex;
  align-items: center;
  height: 100%;
}

.nav-links a {
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  height: 100%;
}

.cart-icon {
  height: 55%;
  width: auto;
  display: block;
}
</style>