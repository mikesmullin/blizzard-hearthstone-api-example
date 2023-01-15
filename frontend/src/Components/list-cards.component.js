import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Form, Table, Row, Col, Button, Modal, ButtonToolbar,
    ButtonGroup, Figure, Stack
} from "react-bootstrap";

const MAX_MANA = 10

const atLeastRange = (min, max) => {
    const a = []
    if (0 === min) return null;
    if (min >= MAX_MANA) return MAX_MANA;
    for (let i = min; i <= max; i++) {
        a.push(i)
    }
    return a.join(',')
}

const getById = (meta, id) => {
    if (!meta) return
    return meta.find(r => r.id === parseInt(id, 10))
}

const range = (min, max) => {
    const a = []
    for (let i = min; i <= max; i++) {
        a.push(i)
    }
    return a
}

const paginationRage = (a, i, m) => {
    return [
        ...a.slice(Math.max(0, i - m), i),
        ...a.slice(i, Math.min(i + m, a.length)),
    ]
}

const ListCards = () => {
    const [meta, setMeta] = useState({ classes: [], rarities: [] });
    const [cards, setCards] = useState([]);
    const [filter, setFilter] = useState({
        class: 'druid',
        mana: 7,
        rarity: 5,
        cardCount: 0,
        page: 1,
        pageSize: 10,
    })

    const refreshMeta = async () => {
        const res1 = await axios({
            method: 'get',
            url: "http://localhost:3001/metadata",
        })
        setMeta(res1.data)
    }

    const refreshCards = async () => {
        const res2 = await axios({
            method: 'get',
            url: 'http://localhost:3001/cards',
            params: {
                class: filter.class,
                mana: atLeastRange(filter.mana, MAX_MANA),
                rarity: getById(meta.rarities, filter.rarity)?.slug ?? (5 === filter.rarity ? "legendary" : null),
                page: filter.page,
                pageSize: filter.pageSize,
            }
        })
        setCards(res2.data.cards)
        filter.cardCount = res2.data.cardCount
        filter.page = res2.data.page
        filter.pageCount = res2.data.pageCount
    }

    useEffect(() => {
        refreshMeta()
    }, [])

    useEffect(() => {
        refreshCards()
    }, [filter])

    const updateFilter = (k, v) => {
        const newFilter = {}
        for (const _k in filter) {
            newFilter[_k] = filter[_k]
        }
        newFilter[k] = v
        setFilter(newFilter)
    }

    const onChangeClass = e => {
        const cls = e.target.value || null
        filter.page = 1
        updateFilter('class', cls)
    }

    const onChangeMana = e => {
        e.target.nextElementSibling.value = `at least ${e.target.value}`
        const mana = parseInt(e.target.value, 10)
        filter.page = 1
        updateFilter('mana', mana)
    }

    const onChangeRarity = e => {
        const rarity = getById(meta.rarities, e.target.value)
        e.target.nextElementSibling.value = rarity?.name
        filter.page = 1
        updateFilter('rarity', rarity?.id)
    }

    return (
        <Stack gap={4}>
            <Form>
                <Row className="justify-content-center align-items-center">
                    <Col xs="auto">
                        <div>
                            <Form.Label htmlFor="class">Class</Form.Label>
                            {meta?.classes?.length > 0 &&
                                <Form.Select name="class" aria-label="Class" defaultValue={filter.class} onChange={onChangeClass}>
                                    <option value="">(Any)</option>
                                    {meta.classes.map(cls => (
                                        <option key={cls.slug} value={cls.slug}>{cls.name}</option>
                                    ))}
                                </Form.Select>
                            }
                        </div>
                    </Col>
                    <Col xs="auto">
                        <div className="my-form-range">
                            <Form.Label htmlFor="mana">Mana</Form.Label>
                            <Form.Range name="mana" min="0" max="10" defaultValue={filter.mana} onChange={onChangeMana} />
                            <output>at least {filter.mana}</output>
                        </div>
                    </Col>
                    <Col xs="auto">
                        <div className="my-form-range">
                            <Form.Label htmlFor="rarity">Rarity</Form.Label>
                            {meta?.rarities?.length > 0 &&
                                <>
                                    <Form.Range name="mana" min="0" max="5" defaultValue={filter.rarity} onChange={onChangeRarity} />
                                    <output>{getById(meta.rarities, filter.rarity)?.name ?? "Any"}</output>
                                </>
                            }
                        </div>
                    </Col>
                </Row>
            </Form>
            <Row className="justify-content-center align-items-center">
                <Col xs="auto">
                    <ButtonToolbar aria-label="pagination">
                        <ButtonGroup className="me-2" aria-label="backward">
                            <Button disabled={filter.page < 2} variant="light" onClick={() => updateFilter('page', 1)}>&lt;&lt;</Button>
                            <Button disabled={filter.page < 2} variant="light" onClick={() => updateFilter('page', filter.page - 1)}>&lt;</Button>
                        </ButtonGroup>
                        <ButtonGroup className="me-2" aria-label="forward">
                            {paginationRage(range(1, filter.pageCount), filter.page, 4).map(i =>
                                <Button key={i} variant={filter.page === i ? 'primary' : 'light'} onClick={() => updateFilter('page', i)}>{i}</Button>
                            )}
                        </ButtonGroup>
                        <ButtonGroup aria-label="Third group">
                            <Button disabled={filter.page >= filter.pageCount} variant="light" onClick={() => updateFilter('page', filter.page + 1)}>&gt;</Button>
                            <Button disabled={filter.page >= filter.pageCount} variant="light" onClick={() => updateFilter('page', filter.pageCount)}>&gt;&gt;</Button>
                        </ButtonGroup>
                    </ButtonToolbar>
                </Col>
                <Col xs="auto">
                    Matches: {filter.cardCount ?? 0}
                </Col>
            </Row>
            <div className="table-wrapper">
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Rarity</th>
                            <th>Set</th>
                            <th>Class</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>{cards.map(card => (
                        <CardRow key={card.id} meta={meta} card={card}></CardRow>
                    ))}</tbody>
                </Table>
            </div>
            <p className="text-center">Powered by Facebook React.js and Twitter Bootstrap.</p>
        </Stack>
    )
}

function CardRow({ meta, card }) {
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <tr>
            <td><img src={card.cropImage} alt="" onClick={handleShow} /></td>
            <td>{card.name}</td>
            <td>{getById(meta.types, card.cardTypeId)?.name}</td>
            <td>{getById(meta.rarities, card.rarityId)?.name}</td>
            <td>{getById(meta.sets, card.cardSetId)?.name}</td>
            <td>{getById(meta.classes, card.classId)?.name}</td>
            <td>
                <Button onClick={handleShow}>View</Button>

                <Modal show={show} onHide={handleClose} centered={true}>
                    <Modal.Header closeButton>
                        <Modal.Title>{card.name}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Figure className="w-100 text-center">
                            <Figure.Image src={card.image} alt="" style={{ minHeight: 518 + 'px' }} />
                            <Figure.Caption>Artist: {card.artistName}</Figure.Caption>
                        </Figure>
                        <p className="w-100 text-center" dangerouslySetInnerHTML={{ __html: card.text }}></p>
                    </Modal.Body>
                    <Modal.Footer>
                        <pre className="pre-scrollable"><code>{JSON.stringify(card, null, 2)}</code></pre>
                    </Modal.Footer>
                </Modal>
            </td>
        </tr >
    )
}


export default ListCards;