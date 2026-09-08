from pathlib import Path
path = Path('/home/ubuntu/gwagwalada-connect/client/src/pages/Home.tsx')
source = path.read_text()
old = '''{requestState === "accepted" ? <Button onClick={() => onMessage(person)}><MessageCircle size={15} /> Message</Button> : requestState === "pending" ? <Button variant="outline" onClick={() => onFriendRequest(person.id, "accepted", person.name)}><UserCheck size={15} /> Accept request</Button> : <Button variant="outline" onClick={() => onFriendRequest(person.id, "pending", person.name)}><UserPlus size={15} /> Add connection</Button>}'''
new = '''{requestState === "accepted" ? <Button onClick={() => onMessage(person)}><MessageCircle size={15} /> Message</Button> : incomingRequests.includes(person.id) ? <div className="person-request-actions"><Button variant="outline" onClick={() => onFriendRequest(person.id, "accept", person.name)}><UserCheck size={15} /> Accept</Button><button className="text-button" onClick={() => onFriendRequest(person.id, "decline", person.name)}>Decline</button></div> : requestState === "pending" ? <Button variant="outline" onClick={() => onFriendRequest(person.id, "cancel", person.name)}>Cancel request</Button> : <Button variant="outline" onClick={() => onFriendRequest(person.id, "send", person.name)}><UserPlus size={15} /> Add connection</Button>}'''
if old not in source:
    raise SystemExit('request control block not found')
path.write_text(source.replace(old, new, 1))
