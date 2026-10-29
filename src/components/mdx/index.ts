/* คอมโพเนนต์ที่ใช้ในไฟล์ .mdx ได้ทันทีโดยไม่ต้อง import ดูวิธีใช้ใน AUTHORING.md */
import Board from "./Board.astro";
import Def from "./Def.astro";
import Example from "./Example.astro";
import Note from "./Note.astro";
import Reveal from "./Reveal.astro";
import Steps from "./Steps.astro";
import Thm from "./Thm.astro";
import Think from "./Think.astro";

export const mdxComponents = { Board, Def, Example, Note, Reveal, Steps, Thm, Think };
