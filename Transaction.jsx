import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Container, Card, Button, Form, Table } from "react-bootstrap";

export default function Transaction() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [receiverUpi, setReceiverUpi] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  // Fetch user info on mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
      fetchBalance(storedUser.upi_id);
      fetchTransactions(storedUser.upi_id);
    }
  }, []);

  const fetchBalance = async (upi_id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/user/${upi_id}`);
      setUser(res.data);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchTransactions = async (upi_id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/transactions/${upi_id}`);
      setTransactions(res.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleTransaction = async () => {
    if (!receiverUpi || !amount) {
      setMessage("Please enter both Receiver UPI and Amount.");
      return;
    }

    try {
      const res = await axios.post(`http://localhost:5000/api/transaction`, {
        sender_upi_id: user.upi_id,
        receiver_upi_id: receiverUpi,
        amount: parseFloat(amount),
      });

      setMessage(res.data.message);
      fetchBalance(user.upi_id);
      fetchTransactions(user.upi_id);
      setAmount('');
      setReceiverUpi('');
    } catch (error) {
      console.error("Transaction Error:", error);
      setMessage(error.response?.data?.message || "Transaction failed.");
    }
  };

  const chartData = transactions
    .map(tx => ({
      timestamp: new Date(tx.timestamp).toLocaleDateString(),
      amount: tx.amount
    }))
    .reverse(); // so latest appears last on graph

  return (
    <Container className="mt-4">
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>User Info</Card.Title>
          {user ? (
            <>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>UPI ID:</strong> {user.upi_id}</p>
              <p><strong>Balance:</strong> ₹{user.balance}</p>
            </>
          ) : (
            <p>Loading user...</p>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Send Money</Card.Title>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Receiver UPI ID</Form.Label>
              <Form.Control
                type="text"
                value={receiverUpi}
                onChange={(e) => setReceiverUpi(e.target.value)}
                placeholder="e.g. abcd@fastpay"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100"
              />
            </Form.Group>
            <Button onClick={handleTransaction}>Send</Button>
          </Form>
          {message && <p className="mt-2 text-primary">{message}</p>}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Transaction History</Card.Title>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Type</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx._id}>
                  <td>{tx.sender_upi_id === user.upi_id ? 'Sent 🔻' : 'Received 🔺'}</td>
                  <td>{tx.sender_upi_id}</td>
                  <td>{tx.receiver_upi_id}</td>
                  <td>₹{tx.amount}</td>
                  <td>{new Date(tx.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card className="mb-5">
        <Card.Body>
          <Card.Title>Transaction Graph</Card.Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#007bff" />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    </Container>
  );
}
