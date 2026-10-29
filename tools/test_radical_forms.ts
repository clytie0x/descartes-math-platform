import assert from "node:assert/strict";
import { checkAnswer, hasForm, parse } from "../src/scripts/mathexpr.ts";

// Catch accepting equivalent answers before extracting squares or collecting terms.
const accepted = ["5sqrt(3)", "sqrt(3)", "-sqrt(3)", "-5sqrt(3)", "sqrt(3)*5",
  "(3/2)sqrt(7)", "3sqrt(7)/2", "sqrt(7)/2", "-3sqrt(7)/2",
  "2sqrt(7)-2sqrt(2)", "2(sqrt(7)-sqrt(2))", "(sqrt(7)-sqrt(2))*2",
  "(sqrt(7)-sqrt(2))/2", "2(sqrt(3)-1)", "3", "-3", "0", "3/2"];
const rejected = ["sqrt(75)", "sqrt(12)", "sqrt(4)", "sqrt(1)", "sqrt(0)",
  "sqrt(-3)", "sqrt(3/4)", "sqrt(1+2)", "sqrt(3)*sqrt(5)", "sqrt(3)^1",
  "2*3sqrt(7)", "1sqrt(3)", "0sqrt(3)", "2(3sqrt(7)-3sqrt(2))",
  "sqrt(3)+sqrt(3)", "sqrt(3)-sqrt(3)", "sqrt(3)+0", "sqrt(3)+2-1",
  "(6/4)sqrt(7)", "6sqrt(7)/4", "sqrt(7)/1", "sqrt(7)/-2",
  "2/sqrt(3)", "10/(sqrt(7)+sqrt(2))", "10(sqrt(7)-sqrt(2))/5",
  "sqrt(3)+sqrt(12)", "(sqrt(7)-sqrt(2))/(1+1)", "1.5sqrt(7)", "x sqrt(3)",
  "sqrt(9007199254740992)"];

let cases = 0;
for (const input of accepted) {
  assert.equal(hasForm(parse(input), "radical"), true, `Should accept ${input}`);
  cases++;
}
for (const input of rejected) {
  assert.equal(hasForm(parse(input), "radical"), false, `Should reject ${input}`);
  cases++;
}
for (const input of ["sqrt(75)", "sqrt(48)+sqrt(27)-sqrt(12)", "10sqrt(3)/2"]) {
  assert.equal(checkAnswer({ type: "number", answer: "5sqrt(3)", form: "radical" }, input).ok, false);
  cases++;
}
assert.equal(checkAnswer({ type: "number", answer: "2sqrt(7)-2sqrt(2)", form: "radical" }, "2(sqrt(7)-sqrt(2))").ok, true);
assert.equal(checkAnswer({ type: "number", answer: "5sqrt(3)", form: "radical" }, "4sqrt(3)").ok, false);
assert.equal(checkAnswer({ type: "number", answer: "5sqrt(3)" }, "sqrt(75)").ok, true);
console.log(`Radical forms passed ${cases + 3} cases`);
