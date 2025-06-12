<template>
  <nav class="navbar">
    <div class="logo">
      <RouterLink to="/home">
        <img src="/joinbar-logo.png" alt="JoinBar Logo" />
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
@reference "tailwindcss";

.navbar {
  @apply flex justify-between items-center px-8 py-4 text-white h-24;
  background-color: var(--color-black);
}

.logo img {
  @apply h-12 w-auto;
}

.nav-links {
  @apply list-none flex gap-6 items-center h-full;
}

.nav-links li {
  @apply flex items-center h-full;
}

.nav-links a {
  @apply text-white no-underline flex items-center h-full;
}

.cart-icon {
  @apply h-[55%] w-auto block;
}
</style>