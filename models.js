
let mongoose = require("mongoose")
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

let userSchema = new mongoose.Schema({
    username: String
})

let User = mongoose.model("User", userSchema)

function addUser(user) {
    let u = new User(user)
    let response = []

    u.save(function (err, data) {
        response[0] = err
        response[1] = data
    })
    return response
}

module.exports = {addUser}