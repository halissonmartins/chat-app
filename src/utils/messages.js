const generateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

const generateLocationMessage = (username, coordinates) => {
    return {
        username,
        url: `https://google.com/maps?q=${coordinates.latitude},${coordinates.longitude}` ,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage,
}