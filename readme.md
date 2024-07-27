# dbHandler

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