import { describe, it, expect } from 'vitest';
import { VM } from '../src/vm/index';
import { perc_string, perc_nil } from '../src/vm/perc_types';
import { parser } from '../src/lang.grammar';

describe('AP CSP Final Project: Quiz Game', () => {
    it('should run a quiz game with mocked input', () => {
        const vm = new VM();
        const printed: string[] = [];
        let error: string | null = null;
        let inputIndex = 0;
        const mockInputs = ["Paris", "London", "Berlin"]; // Correct answers for the quiz

        vm.set_events({
            on_error: (msg) => { error = msg; }
        });

        vm.register_foreign('print', (...args) => {
            printed.push(args.map(a => a.to_string()).join(' '));
            return new perc_nil();
        });

        // Mock input(): return next mock input or default
        vm.register_foreign('input', () => {
            if (inputIndex < mockInputs.length) {
                return new perc_string(mockInputs[inputIndex++]);
            }
            return new perc_string("");
        });

        const code = `
            init capitals = new {
                "France": "Paris",
                "UK": "London",
                "Germany": "Berlin"
            }
            
            init score = 0
            init total = 0
            
            for (init country in capitals) then {
                change total = total + 1
                init answer = input("What is the capital of " + country + "? ")
                init correct = capitals[country]
                
                if (answer == correct) then {
                    change score = score + 1
                    print("Correct!")
                } else {
                    print("Wrong! It is " + correct)
                }
            }
            
            print("Final Score: " + score + "/" + total)
        `;

        vm.execute(code, parser);
        const runner = vm.run();
        let result = runner.next();
        let steps = 0;
        while (!result.done && steps < 10000) {
            result = runner.next();
            steps++;
        }

        if (error) throw new Error(`VM Error: ${error}`);

        // Verify printed output contains "Correct!" x 3 and final score
        // Accessing map order is not guaranteed, but we answered all correctly assuming order matches valid keys...
        // Wait, map iteration order might be arbitrary.
        // My mockInputs are "Paris", "London", "Berlin". 
        // If the map iterates UK first, then input "Paris" -> Wrong.
        // I need to make the test input generic or ensure map iteration order.
        // Or simply check that the logic runs and we get *some* score.
        // BETTER: Mock input to ALWAYS return the correct answer for the prompt?
        // But `input` foreign function doesn't get the prompt arg in my simple mock above if I don't use it.
        // `input` takes an argument.

        // Let's rely on the fact I can read the prompt from the stack if I implemented `input` carefully, 
        // OR just hardcode the logic to answer correctly based on the prompt?
        // But my register_foreign receives the arguments!

        expect(printed.some(p => p.includes("Final Score"))).toBe(true);
    });

    it('should run a quiz game with smart mocked input', () => {
        const vm = new VM();
        const printed: string[] = [];
        let error: string | null = null;

        const db = {
            "France": "Paris",
            "UK": "London",
            "Germany": "Berlin"
        };

        vm.set_events({
            on_error: (msg) => { error = msg; }
        });

        vm.register_foreign('print', (...args) => {
            printed.push(args.map(a => a.to_string()).join(' '));
            return new perc_nil();
        });

        vm.register_foreign('input', (prompt) => {
            const p = prompt.to_string();
            // Expected prompt: "What is the capital of France? "
            for (const [country, capital] of Object.entries(db)) {
                if (p.includes(country)) {
                    return new perc_string(capital);
                }
            }
            return new perc_string("Unknown");
        });

        const code = `
            init capitals = new {
                "France": "Paris",
                "UK": "London",
                "Germany": "Berlin"
            }
            
            init score = 0
            init total = 0
            
            for (init country in capitals) then {
                change total = total + 1
                init answer = input("What is the capital of " + country + "? ")
                
                if (answer == capitals[country]) then {
                    change score = score + 1
                    print("Correct!")
                } else {
                    print("Wrong! It is " + capitals[country])
                }
            }
            
            print("Final Score: " + score + "/" + total)
        `;

        vm.execute(code, parser);
        const runner = vm.run();
        let result = runner.next();
        let steps = 0;
        while (!result.done && steps < 10000) {
            result = runner.next();
            steps++;
        }

        if (error) throw new Error(`VM Error: ${error}`);

        expect(printed).toContain("Correct!");
        expect(printed).toContain("Final Score: 3/3");
    });
});
