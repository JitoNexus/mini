from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/get_wallet', methods=['GET'])
def get_wallet():
    user_id = request.args.get('user_id')
    # Replace this with your real lookup logic
    if user_id == "demo_user":
        return jsonify({'wallet_address': 'SOME_WALLET_ADDRESS'})
    return jsonify({'error': 'Wallet not found'}), 404

@app.route('/api/get_balance', methods=['GET'])
def get_balance():
    wallet = request.args.get('wallet')
    # Replace this with your real balance logic
    if wallet == "SOME_WALLET_ADDRESS":
        return jsonify({'balance': 2.5})
    return jsonify({'error': 'Balance not found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, threaded=True)