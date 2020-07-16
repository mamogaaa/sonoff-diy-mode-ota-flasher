var os = require('os');
var ifaces = os.networkInterfaces();

module.exports = (network) => {
    let result = Object.keys(ifaces).map(function (ifname) {
    var alias = 0;
    let res = []
    
    ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
        }
    
        if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        console.log(ifname + ':' + alias, iface.address);
        res.push(iface.address);
        } else {
        // this interface has only one ipv4 adress
        console.log(ifname, iface.address);
        res.push(iface.address);
        }
        ++alias;
    });
    return res
    }).filter(x => x.length > 0).reduce((prev, current) => [...prev, ...current], []);
    
    return result.find(x => x.indexOf('10.1.30.35'.split('.').slice(0, 3).join('.')) == 0);
}