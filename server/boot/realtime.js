const es = require('event-stream');

module.exports = function(app) {
  const Author = app.models.Author;
//   Author.createChangeStream((err, changes) => {
//     changes.pipe(es.stringify()).pipe(process.stdout);
//   });
  Author.create({
    first_name: 'foo',
    last_name: 'bar',
    birth_date: new Date(),
  });
};
