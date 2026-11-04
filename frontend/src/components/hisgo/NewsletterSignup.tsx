"use client";

export function NewsletterSignup() {
  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <label className="sr-only" htmlFor="email">
        Nhập email của bạn
      </label>
      <input id="email" type="email" placeholder="Nhập email của bạn" />
      <button type="submit">Đăng ký</button>
    </form>
  );
}
