function composeSendMessageRequestAxiosConfig( data) {
    return {
        method: 'post',
        url: process.env.URL,
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
        },
        data
    };
}

module.exports = {
    composeSendMessageRequestAxiosConfig
};