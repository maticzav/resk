/* resk start "dogs" */
const dogs = [
  { name: 'Gal', breed: 'labrador' },
  { name: 'Faya', breed: 'hungarian' },
]
/* end resk */

/* resk start "find" */
function findDog(name) {
  return dogs.find(dog => dog.name === name)
}
/* resk end */
