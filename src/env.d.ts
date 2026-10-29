/// <reference types="astro/client" />

// tsc ไม่รู้จักไฟล์ .astro เอง ให้นับเป็นคอมโพเนนต์ ส่วนเนื้อในไฟล์ astro build ตรวจตอนสร้างเว็บ
declare module "*.astro" {
  const Component: (props: Record<string, unknown>) => unknown;
  export default Component;
}
