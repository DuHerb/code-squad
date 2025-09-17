// This is intentionally bad code for testing automated review
export class TerribleCodeService {
  // Violation 1: Magic numbers everywhere
  // Violation 2: Overly complex function doing too many things
  // Violation 3: Poor naming
  // Violation 4: No error handling
  // Violation 5: Deep nesting
  // Violation 6: Hardcoded strings
  // Violation 7: No comments explaining complex logic
  public processUserStuff(data: any): any {
    if (data) {
      if (data.type == "user") {
        if (data.age > 18) {
          if (data.country === "US") {
            if (data.score >= 75) {
              let result = "";
              for (let i = 0; i < 100; i++) {
                if (i % 3 === 0 && i % 5 === 0) {
                  result += "FizzBuzz";
                } else if (i % 3 === 0) {
                  result += "Fizz";
                } else if (i % 5 === 0) {
                  result += "Buzz";
                } else {
                  result += i.toString();
                }
                if (i < 99) result += ",";
              }

              // Violation 8: Mutating input parameter
              data.fizzbuzz = result;
              data.processed = true;
              data.timestamp = new Date().getTime();

              // Violation 9: Side effects in pure function
              console.log("PROCESSING USER: " + data.name + " AT " + new Date());

              // Violation 10: Complex calculation without explanation
              let x = ((data.score * 1.5) + (data.age * 0.3) - 15) / 2.7;
              data.calculatedValue = x > 50 ? x * 1.1 : x * 0.9;

              return data;
            } else {
              throw new Error("Score too low"); // Fixed: Now throwing Error object
            }
          } else {
            return null; // Violation 12: Inconsistent return types
          }
        } else {
          return false; // Violation 13: More inconsistent return types
        }
      } else {
        return undefined; // Violation 14: Even more inconsistent return types
      }
    } else {
      return "ERROR"; // Violation 15: String error instead of proper error handling
    }
  }

  // Violation 16: Copy-pasted code with slight modifications
  public processAdminStuff(data: any): any {
    if (data) {
      if (data.type == "admin") {
        if (data.age > 21) { // Different age requirement but same structure
          if (data.country === "US") {
            if (data.score >= 80) { // Different score but same structure
              let result = "";
              for (let i = 0; i < 50; i++) { // Different limit but same FizzBuzz
                if (i % 3 === 0 && i % 5 === 0) {
                  result += "FizzBuzz";
                } else if (i % 3 === 0) {
                  result += "Fizz";
                } else if (i % 5 === 0) {
                  result += "Buzz";
                } else {
                  result += i.toString();
                }
                if (i < 49) result += ",";
              }

              data.fizzbuzz = result;
              data.processed = true;
              data.timestamp = new Date().getTime();

              console.log("PROCESSING ADMIN: " + data.name + " AT " + new Date());

              let x = ((data.score * 2.0) + (data.age * 0.5) - 20) / 3.2; // Slightly different formula
              data.calculatedValue = x > 60 ? x * 1.2 : x * 0.8;

              return data;
            } else {
              throw new Error("Admin score too low");
            }
          } else {
            return null;
          }
        } else {
          return false;
        }
      } else {
        return undefined;
      }
    } else {
      return "ADMIN ERROR";
    }
  }

  // Violation 17: Global state modification
  static GLOBAL_COUNTER = 0;

  public incrementCounter() {
    TerribleCodeService.GLOBAL_COUNTER++;
    return TerribleCodeService.GLOBAL_COUNTER;
  }

  // Violation 18: Method that's way too long and does everything
  public doEverything(users: any[], admins: any[], settings: any) {
    let results = [];

    // Process users
    for (let i = 0; i < users.length; i++) {
      try {
        let user = users[i];
        if (user && user.name && user.email) {
          user.email = user.email.toLowerCase();
          user.name = user.name.trim();

          if (user.email.includes("@")) {
            user.validEmail = true;
          } else {
            user.validEmail = false;
          }

          if (user.age) {
            if (user.age < 0) user.age = 0;
            if (user.age > 120) user.age = 120;
          }

          let processed = this.processUserStuff(user);
          if (processed) {
            results.push(processed);
          }
        }
      } catch (e) {
        // Violation 19: Swallowing exceptions
        continue;
      }
    }

    // Process admins (more copy-paste)
    for (let j = 0; j < admins.length; j++) {
      try {
        let admin = admins[j];
        if (admin && admin.name && admin.email) {
          admin.email = admin.email.toLowerCase();
          admin.name = admin.name.trim();

          if (admin.email.includes("@")) {
            admin.validEmail = true;
          } else {
            admin.validEmail = false;
          }

          if (admin.age) {
            if (admin.age < 0) admin.age = 0;
            if (admin.age > 120) admin.age = 120;
          }

          let processed = this.processAdminStuff(admin);
          if (processed) {
            results.push(processed);
          }
        }
      } catch (e) {
        continue;
      }
    }

    // Apply settings (whatever that means)
    if (settings && settings.enableFeatureX) {
      for (let k = 0; k < results.length; k++) {
        results[k].featureX = true;
        results[k].featureXValue = Math.random() * 100; // Violation 20: Non-deterministic behavior
      }
    }

    // More global state modification
    TerribleCodeService.GLOBAL_COUNTER += results.length;

    return results;
  }
}