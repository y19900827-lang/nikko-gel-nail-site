document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML("afterbegin", `
    <header class="header">
      <div class="header-inner">
        <a class="brand" href="index.html">
          <span class="mark logo-mark"><img src="images/nikko-emblem-transparent.png" alt="ダンスファッションニッコウ ロゴ"></span>
          <span>ダンスファッションニッコウ</span>
        </a>
        <nav>
          <a href="menu.html">メニュー</a><a href="price.html">料金</a><a href="gallery.html">デザイン</a><a href="first.html">初めての方へ</a><a href="reviews.html">口コミ</a><a href="access.html">アクセス</a>
        </nav>
        <a class="gel-button" href="reserve.html">予約する</a>
      </div>
    </header>
  `);
  document.body.insertAdjacentHTML("beforeend", `
    <footer class="footer"><div class="footer-inner"><span>© ダンスファッションニッコウ</span><span><a href="reserve.html">予約ページへ</a>　<a href="admin-reservations.html">管理者予約帳</a></span></div></footer>
  `);
});
