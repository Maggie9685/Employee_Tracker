const express = require('express');
const mysql = require('mysql2');
const inquirer = require('inquirer');
const cTable = require('console.table');

const PORT = process.env.PORT || 3001;
const app = express();

var temp_list;

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const db = mysql.createConnection(
  {
    host: 'localhost',
    // MySQL username,
    user: 'root',
    // MySQL password
    password: //Please enter your own
    database: 'company_db'
  },
  console.log(`Connected to the inventory_db database.`)
);

class Company  {

    constructor (employee, role, department, manager) {
        this.employee = employee;
        this.role = role;
        this.department = department;
        this.manager = manager;
    }

    UpdateInfo (results,choice)  {
        var temp = [];
        for(var i = 0; i <results.length; i++){
            temp.push(Object.values(results[i]).toString());
        }
        if(choice === "employee"){
            this.employee = temp;
        } else if (choice === "employee list") {
            temp.push('No manager');
            this.employee = temp;
        } else if (choice === "role") {
            this.role = temp;
        } else if (choice === "department") {
            this.department = temp;
        } else { //manager
            this.manager = temp;
        }
    }

    GetEmployee () {
        return db.promise().query(`
            SELECT DISTINCT
                e1.id AS id, e1.first_name AS first_name, e1.last_name AS last_name, 
                role.title AS role, department.name AS department, role.salary AS salary, 
                concat(e2.first_name , " " , e2.last_name) AS manager 
            FROM employee e1
            JOIN role ON e1.role_id = role.id
            JOIN department ON role.department_id = department.id
            LEFT JOIN employee e2 ON e1.manager_id = e2.id
            AND (e1.first_name <> e2.first_name AND e1.last_name <> e2.last_name); 
        `).then(([rows,fields]) => {
            console.table(rows);
        });
    }

    GetDepartment () {
        return db.promise().query(`
            SELECT
                department.name AS department 
            FROM department;
        `).then(([rows,fields]) => {
            console.table(rows);
        });
    }

    GetRole () {
        return db.promise().query(`
            SELECT
                role.title AS role 
            FROM role;
        `).then(([rows,fields]) => {
            console.table(rows);
        });
    }

}

const MyCompany = new Company();


const GetChoice = () => {
    inquirer.prompt([
    {
        type: "list",
        name: "type",
        message: "What would you like to do?",
        choices:    ["View All Employees", "View All Employees By Department", "View All Employees By Manager (Coming feature)", 
                    "Add Employee", "Remove Employee", "Update Employee Role", "Update Employee Manager (Coming feature)", 
                    "View All Roles", "Add Role", "Remove Role", 
                    "View All Departments", "Add Department", "Remove Department", 
                    "View Total Utilized Budget By Department (Coming feature)", "Quit"]
    }]).then ( (answer) => {
        if(answer.type === "Quit") { //stop the loop
            console.log("Closing....");
            process.exit();
        }
        else{
            if(answer.type === "View All Employees") {
                MyCompany.GetEmployee()
                .then(() => 
                        GetChoice());
            }
            if(answer.type === "View All Employees By Department"){      
                db.promise().query(`SELECT department.name AS department FROM department;`)
                .then(([rows,fields]) => {    
                    MyCompany.UpdateInfo(rows,"department");})
                .then(() => {   
                    inquirer.prompt([
                        {
                            type: "list",
                            name: "type",
                            message: "Which department would you like to view?",
                            choices:    MyCompany.department
                        }]).then ( (answer) => {
                            for(var i = 0; i < MyCompany.department.length; i++) 
                                if(answer.type === MyCompany.department[i]) { 
                                    db.query(`
                                        SELECT DISTINCT
                                            e1.id AS id, e1.first_name AS first_name, e1.last_name AS last_name, 
                                            role.title AS role, department.name AS department, role.salary AS salary, 
                                            concat(e2.first_name , " " , e2.last_name) AS manager 
                                        FROM employee e1
                                        JOIN role ON e1.role_id = role.id
                                        JOIN department ON role.department_id = department.id
                                        AND (role.department_id = ${i+1})
                                        LEFT JOIN employee e2 ON e1.manager_id = e2.id
                                        AND (e1.first_name <> e2.first_name AND e1.last_name <> e2.last_name); 
                                    `, function (err, results) {
                                        console.table(results);
                                        GetChoice();
                                    })  
                                }
                    })})
            }
            if(answer.type === "Add Employee"){
                db.promise().query(`SELECT concat(employee.first_name , " " , employee.last_name) AS employee FROM employee;`)
                .then(([rows,fields]) => {    
                    MyCompany.UpdateInfo(rows,"employee list");})
                .then(() => {   
                    db.promise().query(`SELECT role.title AS role FROM role;`)
                .then(([rows,fields]) => {    
                    MyCompany.UpdateInfo(rows,"role");})
                .then(() => { 
                    inquirer.prompt([
                        {
                            type: 'input',
                            name: 'first_name',
                            message: 'First name: ',
                            validate: nameInput => {
                            if (nameInput) {
                                return true;
                            } else {
                                console.log("Please enter employee's first name!");
                                return false;
                            }
                        }},{
                            type: 'input',
                            name: 'last_name',
                            message: 'Last name: ',
                            validate: nameInput => {
                            if (nameInput) {
                                return true;
                            } else {
                                console.log("Please enter employee's last name!");
                                return false;
                            }
                        }
                        },{
                            type: "list",
                            name: "role",
                            message: "What is his/her role?",
                            choices:    MyCompany.role
                        },{
                            type: "list",
                            name: "manager",
                            message: "Who is the manager?",
                            choices:    MyCompany.employee
                        }
                    ]).then ( (answer) => {
                        temp_list = answer;
                        db.promise().query(`SELECT id FROM role WHERE title = "${answer.role}";`)
                        .then(([rows,fields]) => {   
                            temp_list.role = Object.values(rows[0]).toString();})
                            db.promise().query(`SELECT id FROM employee WHERE concat(employee.first_name , " " , employee.last_name) = "${temp_list.manager}";`)
                            .then(([rows,fields]) => {  
                                if(temp_list.manager != "No manager") {
                                    temp_list.manager = Object.values(rows[0]).toString();
                                }
                                else {
                                    temp_list.manager = null;
                                }
                                db.query(`INSERT INTO employee(first_name, last_name, role_id, manager_id) 
                                VALUES ("${temp_list.first_name}", "${temp_list.last_name}", ${temp_list.role}, ${temp_list.manager});`, function (err, results) {
                                    GetChoice();
                            })})
                        })})})
                     }
            if(answer.type === "Remove Employee"){
                db.promise().query(`SELECT concat(employee.first_name , " " , employee.last_name) AS employee FROM employee;`)
                .then(([rows,fields]) => {    
                    MyCompany.UpdateInfo(rows,"employee");})
                .then(() => {   
                    inquirer.prompt([
                        {
                            type: "list",
                            name: "type",
                            message: "Which employee would you like to remove?",
                            choices:    MyCompany.employee
                        }]).then ( (answer) => {
                            db.query(`DELETE FROM employee WHERE concat(employee.first_name , " " , employee.last_name) = ?`, answer.type, function (err, results) {
                                GetChoice();
                              });
                })})
            }
            if(answer.type === "Update Employee Role"){
                db.promise().query(`SELECT concat(employee.first_name , " " , employee.last_name) AS employee FROM employee;`)
                .then(([rows,fields]) => {    
                    MyCompany.UpdateInfo(rows,"employee");})
                .then(() => {   
                    db.promise().query(`SELECT role.title AS role FROM role;`)
                .then(([rows,fields]) => {    
                    MyCompany.UpdateInfo(rows,"role");})
                .then(() => {   
                    inquirer.prompt([
                        {
                            type: "list",
                            name: "name",
                            message: "Which employee would you like to update?",
                            choices:    MyCompany.employee
                        },
                        {
                            type: "list",
                            name: "role",
                            message: "What is the new role?",
                            choices:    MyCompany.role
                        }
                    ]).then ( (answer) => {
                            temp_list = answer;
                            db.promise().query(`SELECT id FROM role WHERE title = "${answer.role}";`)
                            .then(([rows,fields]) => {   
                                temp_list.role = Object.values(rows[0]).toString();
                                db.query(`UPDATE employee SET role_id = ${temp_list.role} WHERE concat(employee.first_name , " " , employee.last_name) = "${temp_list.name}";`, function (err, results) {
                                    GetChoice();
                                });})
                })})})
            }
            if(answer.type === "View All Departments") {
                MyCompany.GetDepartment()
                .then(() => 
                        GetChoice());
            }
            if(answer.type === "Add Department"){
                inquirer.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: 'Department to add: ',
                        validate: nameInput => {
                          if (nameInput) {
                            return true;
                          } else {
                            console.log('Please enter department you want to add!');
                            return false;
                          }
                    }}]).then ( (answer) => {
                        db.query(`INSERT INTO department(name) VALUES ("${answer.name}")`, function (err, results) {
                            GetChoice();
                          });
                    })
            }
            if(answer.type === "Remove Department"){
                db.promise().query(`SELECT department.name AS department FROM department;`)
                .then(([rows,fields]) => {    
                    MyCompany.UpdateInfo(rows,"department");})
                .then(() => {   
                    inquirer.prompt([
                        {
                            type: "list",
                            name: "type",
                            message: "Which department would you like to remove?",
                            choices:    MyCompany.department
                        }]).then ( (answer) => {
                            db.query(`DELETE FROM department WHERE name = ?`, answer.type, function (err, results) {
                                GetChoice();
                              });
                })})
            }
            if(answer.type === "View All Roles") {
                db.promise().query(`
                    SELECT
                        role.title AS role, role.salary AS salary 
                    FROM role;
                `).then(([rows,fields]) => {
                    console.table(rows);
                    GetChoice()
                });
        
              
            }
            if(answer.type === "Add Role"){ 
                db.promise().query(`SELECT department.name AS department FROM department;`)
                .then(([rows,fields]) => {    
                    MyCompany.UpdateInfo(rows,"department");})
                .then(() => {  
                    inquirer.prompt([
                        {
                            type: 'input',
                            name: 'name',
                            message: 'Role to add: ',
                            validate: nameInput => {
                            if (nameInput) {
                                return true;
                            } else {
                                console.log('Please enter role you want to add!');
                                return false;
                            }
                        }},
                        {
                            type: 'input',
                            name: 'salary',
                            message: 'Salary for this role: ',
                            validate: nameInput => {
                            if (nameInput) {
                                return true;
                            } else {
                                console.log('Please enter salary for this new role!');
                                return false;
                            }
                        }},{
                            type: "list",
                            name: "type",
                            message: "Which department does this role belong to?",
                            choices:    MyCompany.department 
                        }
                    ]).then ( (answer) => {
                        temp_list = answer;
                        db.promise().query(`SELECT id FROM department WHERE name = "${answer.type}";`)
                        .then(([rows,fields]) => {   
                            temp_list.type = Object.values(rows[0]).toString();
                            db.query(`INSERT INTO role(title, salary, department_id) VALUES ("${temp_list.name}", ${temp_list.salary}, ${temp_list.type})`, function (err, results) {
                                GetChoice();
                            });
                        })})
                    })
            }
            if(answer.type === "Remove Role"){
                db.promise().query(`SELECT role.title AS role FROM role;`)
                .then(([rows,fields]) => {    
                    MyCompany.UpdateInfo(rows,"role");})
                .then(() => {   
                    inquirer.prompt([
                        {
                            type: "list",
                            name: "type",
                            message: "Which role would you like to remove?",
                            choices:    MyCompany.role
                        }]).then ( (answer) => {
                            db.query(`DELETE FROM role WHERE title = ?`, answer.type, function (err, results) {
                                GetChoice();
                              });
                })})
            }
            }})
        .catch(err => {
            console.log(err);}); 
}


GetChoice();


app.use((req, res) => {
  res.status(404).end();
});

