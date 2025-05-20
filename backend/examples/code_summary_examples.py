java_example_1 = '''
<Example>
Input:
"
    public class Factorial {
        public static void main(String[] args) {
            int number = 5;
            long factorial = 1;
            for (int i = 1; i <= number; i++) {
                factorial *= i;
            }
            System.out.println("Factorial of " + number + " is " + factorial);
        }
    }
"
Output:
"
{
    "Title": "Calculating Factorial in Java",
    "Summary": "
    This Java program calculates the factorial of a given number using a for loop.
    The 'Factorial' class contains a 'main' method where an integer 'number' is defined.
    A 'for' loop iterates from 1 to 'number', multiplying 'factorial' by each 'i'.
    The result is printed using 'System.out.println'.
    This example demonstrates basic loop constructs and arithmetic operations in Java.
    "
}
"
</Example>
'''

python_example_1 = '''
<Example>
Input:
"
    # Python program to check if a number is prime
    def is_prime(n):
        if n <= 1:
            return False
        for i in range(2, int(n**0.5) + 1):
            if n % i == 0:
                return False
        return True

    number = 29
    if is_prime(number):
        print(f"{number} is a prime number")
    else:
        print(f"{number} is not a prime number")
"
Output:
"
{
    "Title": "Prime Number Check in Python",
    "Summary": "
    This Python program checks if a given number is prime.
    The 'is_prime' function returns 'True' if 'n' is a prime number, otherwise 'False'.
    It uses a loop to check divisibility from 2 to the square root of 'n'.
    The result is printed using an f-string.
    This example demonstrates function definition, loops, and conditional statements in Python.
    "
}
"
</Example>
'''

c_example = '''
<Example>
Input:
"
    #include <iostream>
    using namespace std;

    bool isPalindrome(string str) {
        int n = str.length();
        for (int i = 0; i < n / 2; i++) {
            if (str[i] != str[n - i - 1]) {
                return false;
            }
        }
        return true;
    }

    int main() {
        string word = "radar";
        if (isPalindrome(word)) {
            cout << word << " is a palindrome" << endl;
        } else {
            cout << word << " is not a palindrome" << endl;
        }
        return 0;
    }
"
Output:
"
{
    "Title": "Palindrome Check in C++",
    "Summary": "
    This C++ program checks if a given string is a palindrome.
    The 'isPalindrome' function compares characters from the start and end of the string.
    If all characters match, it returns 'true'; otherwise, 'false'.
    The 'main' function tests this with the string 'radar'.
    This example demonstrates string manipulation and basic I/O in C++.
    "
}
"
</Example>
'''
