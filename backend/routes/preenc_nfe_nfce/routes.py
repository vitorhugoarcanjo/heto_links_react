from flask import Blueprint, jsonify, request, send_file
from .schemas import GerarSequenciaRequestSchema
from .services import gerar_documento_sequencia_docx

preenc_nfe_nfce_bp = Blueprint("preenc_nfe_nfce", __name__)


@preenc_nfe_nfce_bp.post("/api/fiscal/gerar-sequencia-docx")
def gerar_sequencia_docx():
    try:
        req = GerarSequenciaRequestSchema.from_payload(request.get_json(silent=True))
        buffer, nome_arquivo = gerar_documento_sequencia_docx(req)
        return send_file(
            buffer,
            as_attachment=True,
            download_name=nome_arquivo,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    except FileNotFoundError as exc:
        return jsonify({"erro": str(exc)}), 404
    except Exception as exc:
        return jsonify({"erro": f"Falha ao gerar documento Word: {exc}"}), 500