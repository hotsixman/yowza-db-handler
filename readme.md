# dbHandler

## 환경변수
`.env` 파일에 다음과 같은 값을 작성하면 DB에 요청을 보낼 준비가 됩니다.
```env
process.env.DB_HOST = "host"
process.env.DB_USER = "user"
process.env.DB_PASSWORD = "password"
process.env.DB_PORT = "port"
process.env.DB_DATABASE = "database"
```

## defineDBHandler

```ts
interface Student{
    order: number;
    id: number;
    name: string;
    age: number;
}

const getAllStudents = defineDBHandler<[], Student[]>(() => { //제네릭으로 파라미터 타입과 리턴 타입을 설정할 수 있습니다.
    return async(run) => {
        return await run("SELECT * FROM `student`"); //run은 sql 서버에 요청을 보내 sql문을 실행합니다.
    }
})

//파라미터 타입은 제네릭의 배열 안에 순서대로 넣어서 설정합니다. 
//여기서 id는 number가 됩니다.
const getStudentById = defineDBHandler<[number], Student | null>((id) => {
    return async(run) => {
        //run의 두번째 파라미터를 사용하여 sql문에 escape된 값을 넣을 수 있습니다.
        const result = await run("SELECT * FROM `student` WHERE `id` = ?", [id]);
        if(result.length === 0){
            return null;
        }
        else{
            return result[0];
        }
    }
});

const updateStudent = defineDBHandler<[Student], void>((student) => {
    return async(run) => {
        //커넥션을 여러번 생성하는 것을 방지하기 위해 getCallback 메소드를 사용합니다.
        //getCallback 메소드는 run을 파라미터로 받는 함수를 반환합니다.
        const student = await getStudentById.getCallback(student.id)(run);

        if(student){
            await run("UPDATE `student` SET `name` = ?, `age` = ? WHERE `id` = ?", [student.name, student.age, student.id]);
        }
        else{
            await run("INSERT INTO `student` (`id`, `name`, `age`) VALUES (?, ?, ?)", [student.id, student.name, student.age]);
        }
    }
})
```

## runQuery

```ts
// runQuery를 사용하여 DBHandler를 사용하지 않고 DB에 요청을 보낼 수 있습니다.
// 제네릭을 사용하여 리턴 값의 타입을 정할 수 있습니다.
const student = await runQuery<Student | null>(async(run) => {
    const result = await run("SELECT * FROM `student` WHERE `id` = ?", [id]);
    if(result.length === 0){
        return null;
    }
    else{
        return result[0];
    }
})

// 그러나 runQuery는 한번의 DB 연결에서 많은 DBHandler들을 실행해야 할 때 더 유용합니다.
const getStudents = defineDBHandler<[], Student[]>(() => {
    return async(run) => {
        return await run("SELECT * FROM `student`");
    }
});
const getClassrooms = defineDBHandler<[], Classroom[]>(() => {
    return async(run) => {
        return await run("SELECT * FROM `classroom`");
    }
});
const studentsAndClassrooms = await runQuery<{students: Student[], classrooms:Classroom[]}>(async(run) => {
    const students = await getStudents.getCallback()(run);
    const classrooms = await getStudents.getCallback()(run);

    return {
        students,
        classrooms
    }
})
```

## DBConnector
기본적으로 `defineDBHandler`와 `runQuery`는 `.env` 파일에 적힌 DB로 요청을 보냅니다. 다른 DB로 요청을 보내려면 `DBConnector` 클래스로 인스턴스를 만들어 요청을 보낼 수 있습니다.

```ts
const anotherDBConnector = new DBConnector({
    host: 'another host',
    user: 'another user',
    password: 'another password',
    port: 3306 // or any,
    database: 'another database'
});

const handler = anotherDBConnector.defineDBHandler(() => {
    return async(run) => {
        ...
    }
});

const result = await anotherDBConnector.runQuery(async(run) => {
    ...
})
```