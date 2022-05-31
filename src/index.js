function composeSendMessageRequestAxiosConfig( data) {
    return {
        method: 'post',
        url: 'https://discord.com/api/webhooks/980526309480480808/lqPjdvYJrnLxy0VuWxCC8_H5XDFbTR95ylkRiKoJ7DniPV9fdumAV_2b0qGjH2GeSvpD',
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