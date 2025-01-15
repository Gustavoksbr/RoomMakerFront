export class JsonParseExamples {
  static JsonParse() {
    // Exemplo 1: Parse de uma string JSON simples
    const jsonString = '{"name": "John", "age": 30, "city": "New York"}';
    const jsonObject = JSON.parse(jsonString);
    console.log(jsonObject); // { name: 'John', age: 30, city: 'New York' }

    // Exemplo 2: Parse de uma string JSON com array
    const jsonArrayString = '[{"name": "John"}, {"name": "Jane"}]';
    const jsonArray = JSON.parse(jsonArrayString);
    console.log(jsonArray); // [ { name: 'John' }, { name: 'Jane' } ]

    // Exemplo 3: Parse de uma string JSON com valores aninhados
    const nestedJsonString = '{"person": {"name": "John", "age": 30}, "city": "New York"}';
    const nestedJsonObject = JSON.parse(nestedJsonString);
    console.log(nestedJsonObject); // { person: { name: 'John', age: 30 }, city: 'New York' }
  }
  static JsonStringify() {
    // Exemplo 1: Stringify de um objeto simples
    const jsonObject = { name: 'John', age: 30, city: 'New York' };
    const jsonString = JSON.stringify(jsonObject);
    console.log(jsonString); // '{"name":"John","age":30,"city":"New York"}'

    // Exemplo 2: Stringify de um array de objetos
    const jsonArray = [{ name: 'John' }, { name: 'Jane' }];
    const jsonArrayString = JSON.stringify(jsonArray);
    console.log(jsonArrayString); // '[{"name":"John"},{"name":"Jane"}]'

    // Exemplo 3: Stringify de um objeto com valores aninhados
    const nestedJsonObject = { person: { name: 'John', age: 30 }, city: 'New York' };
    const nestedJsonString = JSON.stringify(nestedJsonObject);
    console.log(nestedJsonString); // '{"person":{"name":"John","age":30},"city":"New York"}'
  }
}
