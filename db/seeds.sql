INSERT INTO department(id, name)
VALUES  (1, "Sales"),
        (2, "Engineering"),
        (3, "Finance"),
        (4, "Legal");

INSERT INTO role(id, title, salary, department_id)
VALUES  (1, "Salesperson", 50000, 1),
        (2, "Lead Engineer", 130000, 2),
        (3, "Sofeware Engineer", 100000, 2),
        (4, "Account Manager", 70000, 3),
        (5, "Accountant", 65000, 3),
        (6, "Legal Team Lead", 95000, 4),
        (7, "Lawyer", 90000, 4);

INSERT INTO employee(id, first_name, last_name, role_id, manager_id)
VALUES  (1, "Anna", "White", 2, null),
        (2, "John", "Smith", 6, null),
        (3, "Danny", "Mann", 7, 2),
        (4, "Joe", "Kassir", 4, null),
        (5, "Michelle", "Baker", 5, 4),
        (6, "Frank", "Walker", 3, 1),
        (7, "Christian", "Hunt", 1, null);
